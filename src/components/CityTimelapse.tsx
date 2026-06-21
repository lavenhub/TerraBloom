"use client";

/**
 * CityTimelapse — per-activity frames
 *
 * Each frame = the city state AFTER adding that activity.
 * Frame 1 = city after upload #1, Frame 2 = after upload #2, etc.
 * Works perfectly for single-day testing.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { useTerraStore } from "@/store/useTerraStore";
import { scoreTier } from "@/lib/cityRules";
import type { Activity, CityState } from "@/store/useTerraStore";

const City3D = dynamic(() => import("@/components/City3D"), { ssr: false });

/** Playback speeds available to the user */
const SPEEDS    = [0.5, 1, 2, 4];
/** Base duration in milliseconds per frame at 1x speed */
const BASE_MS   = 1800;

/* ── Frame type ─────────────────────────────────────────────────── */
interface ActivityFrame {
  index:       number;        // 1-based
  activity:    Activity;      // the upload that triggered this frame
  cityState:   CityState;     // city after this upload
  score:       number;        // overallScore after this upload
  delta:       number;        // score change vs previous frame
  totalCarbon: number;
}

/* ── City computation after N activities ────────────────────────── */
function cityAfterN(activities: Activity[], n: number): CityState {
  const slice = activities.slice(0, n);
  if (slice.length === 0) return { treeCount: 50, pollutionLevel: 40, greenness: 50, waterClarity: 60, biodiversity: 50, renewableEnergy: 30, overallScore: 55 };
  const avg    = slice.reduce((s, a) => s + a.sustainabilityScore, 0) / slice.length;
  const weight = 1 - Math.exp(-slice.length / 4);
  const city   = Math.round(55 + (avg - 55) * weight);
  const score  = Math.min(100, Math.max(0, city));
  const c      = score / 100;
  return {
    treeCount:       Math.round(20 + c * 80),
    pollutionLevel:  Math.round(100 - c * 90),
    greenness:       Math.round(10 + c * 90),
    waterClarity:    Math.round(20 + c * 80),
    biodiversity:    Math.round(10 + c * 90),
    renewableEnergy: Math.round(c * 100),
    overallScore:    score,
  };
}

/* ── Build frames ────────────────────────────────────────────────── */
function buildActivityFrames(activities: Activity[]): ActivityFrame[] {
  // Sort oldest first so playback is chronological
  const sorted = [...activities].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return sorted.map((activity, i) => {
    const city  = cityAfterN(sorted, i + 1);
    const prev  = i === 0 ? 55 : cityAfterN(sorted, i).overallScore;
    return {
      index:       i + 1,
      activity,
      cityState:   city,
      score:       city.overallScore,
      delta:       city.overallScore - prev,
      totalCarbon: Math.round(sorted.slice(0, i + 1).reduce((s, a) => s + a.carbonEstimate, 0) * 10) / 10,
    };
  });
}

/* ════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
/**
 * CityTimelapse
 * 
 * Interactive component that plays back the user's activities chronologically,
 * displaying how the city evolved over time with each logged action.
 */
export default function CityTimelapse() {
  const { activities } = useTerraStore();

  const frames      = buildActivityFrames(activities);
  const total       = frames.length;

  const [frameIdx, setFrameIdx] = useState(total > 0 ? total - 1 : 0);
  const [playing, setPlaying]   = useState(false);
  const [speed, setSpeed]       = useState(1);
  const [open, setOpen]         = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep frameIdx valid when activities change
  useEffect(() => {
    if (total > 0 && frameIdx >= total) setFrameIdx(total - 1);
  }, [total, frameIdx]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  /* Playback loop */
  useEffect(() => {
    clearTimer();
    if (!playing || total < 2) return;
    timerRef.current = setInterval(() => {
      setFrameIdx((i) => {
        if (i >= total - 1) { setPlaying(false); return i; }
        return i + 1;
      });
    }, Math.round(BASE_MS / speed));
    return clearTimer;
  }, [playing, speed, total, clearTimer]);

  const play = () => {
    if (frameIdx >= total - 1) setFrameIdx(0);
    setPlaying(true);
  };

  if (total === 0) return null;

  const frame      = frames[frameIdx];
  const tier       = scoreTier(frame.score);
  const scoreColor = tier.color;
  const progress   = total > 1 ? (frameIdx / (total - 1)) * 100 : 100;
  const deltaColor = frame.delta > 0 ? "var(--green)" : frame.delta < 0 ? "#f87171" : "var(--text-dim)";
  const deltaLabel = frame.delta > 0 ? `+${frame.delta}` : `${frame.delta}`;

  const impactColor = frame.activity.impact === "positive" ? "var(--green)"
    : frame.activity.impact === "negative" ? "#f87171" : "var(--text-dim)";

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => { setOpen(!open); if (!open) setFrameIdx(total - 1); }}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: open ? "rgba(34,197,94,0.12)" : "var(--surface-2)",
          border: open ? "1px solid rgba(34,197,94,0.35)" : "1px solid var(--border)",
          borderRadius: 8, padding: "8px 16px", cursor: "pointer",
          fontSize: "0.875rem", fontWeight: 600,
          color: open ? "var(--green)" : "var(--text-dim)",
          transition: "all 0.2s ease",
        }}
      >
        <span>⏱</span>
        City Evolution
        <span style={{
          fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.07em",
          background: "rgba(34,197,94,0.15)", color: "var(--green)",
          padding: "2px 7px", borderRadius: 4,
        }}>
          {total} upload{total !== 1 ? "s" : ""}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              background: "var(--surface-2)", border: "1px solid var(--border)",
              borderRadius: 16, overflow: "hidden", marginTop: 12,
            }}>

              {/* 3D City viewport */}
              <div style={{ position: "relative", height: 340, background: "#080808" }}>
                <AnimatePresence mode="wait">
                  <motion.div key={frameIdx}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <City3D cityState={frame.cityState} interactive={!playing} cameraPosition={[10, 7, 10]} />
                  </motion.div>
                </AnimatePresence>

                {/* Upload label — top left */}
                <div style={{
                  position: "absolute", top: 12, left: 12,
                  background: "rgba(0,0,0,0.80)", border: "1px solid var(--border)",
                  borderRadius: 9, padding: "8px 14px",
                }}>
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
                    Upload {frame.index} of {total}
                  </div>
                  <div style={{
                    fontSize: "0.8rem", fontWeight: 600, color: impactColor,
                    maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {frame.activity.note || frame.activity.category}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {format(new Date(frame.activity.timestamp), "MMM d · HH:mm")}
                  </div>
                </div>

                {/* Score + delta — top right */}
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: "rgba(0,0,0,0.80)", border: `1px solid ${scoreColor}40`,
                  borderRadius: 9, padding: "8px 14px", textAlign: "center",
                  minWidth: 80,
                }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                    {frame.score}
                  </div>
                  <div style={{ fontSize: "0.62rem", color: scoreColor, fontWeight: 600, marginTop: 1 }}>
                    {tier.label}
                  </div>
                  {frame.index > 1 && (
                    <div style={{
                      marginTop: 4, fontSize: "0.75rem", fontWeight: 700,
                      color: deltaColor,
                      background: `${deltaColor}18`,
                      borderRadius: 4, padding: "1px 6px",
                    }}>
                      {deltaLabel} pts
                    </div>
                  )}
                </div>

                {/* Bottom stats */}
                <div style={{
                  position: "absolute", bottom: 12, left: 12, right: 12,
                  display: "flex", gap: 8,
                }}>
                  {[
                    { label: "Category",   value: frame.activity.category },
                    { label: "Activity Score", value: frame.activity.sustainabilityScore },
                    { label: "Carbon",     value: `${frame.activity.carbonEstimate}kg` },
                    { label: "Total Carbon", value: `${frame.totalCarbon}kg` },
                  ].map((s) => (
                    <div key={s.label} style={{
                      background: "rgba(0,0,0,0.75)", border: "1px solid var(--border)",
                      borderRadius: 7, padding: "5px 10px", flex: 1, textAlign: "center",
                    }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.value}</div>
                      <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score bar chart — one bar per upload */}
              <div style={{ padding: "10px 16px 0", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 36 }}>
                  {frames.map((f, i) => {
                    const h   = 4 + (f.score / 100) * 32;
                    const col = scoreTier(f.score).color;
                    return (
                      <button key={i}
                        onClick={() => { setPlaying(false); setFrameIdx(i); }}
                        title={`Upload ${f.index}: ${f.activity.category} · Score ${f.score} (${f.delta >= 0 ? "+" : ""}${f.delta})`}
                        style={{
                          flex: 1, height: `${h}px`, borderRadius: 3,
                          background: i === frameIdx ? col : `${col}50`,
                          border: "none", cursor: "pointer", padding: 0,
                          outline: i === frameIdx ? `2px solid ${col}` : "none",
                          outlineOffset: 2,
                          transition: "all 0.15s ease",
                          minWidth: 4,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Progress line */}
                <div style={{ height: 2, background: "var(--surface-3)", borderRadius: 1, margin: "8px 0 0", overflow: "hidden" }}>
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.15 }}
                    style={{ height: "100%", background: "var(--green)", borderRadius: 1 }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div style={{
                padding: "12px 16px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, flexWrap: "wrap",
              }}>
                {/* Playback */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => { setPlaying(false); setFrameIdx((i) => Math.max(0, i - 1)); }}
                    disabled={frameIdx === 0}
                    style={{ ...btn, opacity: frameIdx === 0 ? 0.3 : 1 }}>◀</button>

                  <button onClick={() => playing ? setPlaying(false) : play()}
                    style={{ ...btn, minWidth: 90, background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.3)", color: "var(--green)", fontWeight: 700 }}>
                    {playing ? "⏸ Pause" : frameIdx >= total - 1 ? "↺ Replay" : "▶ Play"}
                  </button>

                  <button onClick={() => { setPlaying(false); setFrameIdx((i) => Math.min(total - 1, i + 1)); }}
                    disabled={frameIdx === total - 1}
                    style={{ ...btn, opacity: frameIdx === total - 1 ? 0.3 : 1 }}>▶</button>
                </div>

                {/* Counter */}
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                  Upload <strong style={{ color: "#fff" }}>{frame.index}</strong> / <strong style={{ color: "#fff" }}>{total}</strong>
                  {frame.index > 1 && (
                    <span style={{ marginLeft: 8, color: deltaColor, fontWeight: 700 }}>
                      {deltaLabel} pts
                    </span>
                  )}
                </div>

                {/* Speed */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Speed</span>
                  {SPEEDS.map((s) => (
                    <button key={s} onClick={() => setSpeed(s)} style={{
                      ...btn, minWidth: 38, fontSize: "0.72rem",
                      background: speed === s ? "rgba(34,197,94,0.12)" : "var(--surface-3)",
                      borderColor: speed === s ? "rgba(34,197,94,0.3)" : "var(--border)",
                      color: speed === s ? "var(--green)" : "var(--text-dim)",
                    }}>{s}×</button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const btn: React.CSSProperties = {
  background: "var(--surface-3)",
  border: "1px solid var(--border)",
  borderRadius: 7, color: "var(--text-dim)",
  cursor: "pointer", fontSize: "0.8125rem",
  fontWeight: 500, padding: "6px 12px",
  transition: "all 0.15s ease",
};
