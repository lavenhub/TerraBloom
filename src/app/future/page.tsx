"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { useTerraStore } from "@/store/useTerraStore";
import type { CityState } from "@/store/useTerraStore";

const City3D = dynamic(() => import("@/components/City3D"), { ssr: false });

/* ── Comparison column ───────────────────────────────────────────── */
function FutureColumn({
  title, tag, tagColor, cityState, borderColor, score,
}: {
  title: string; tag: string; tagColor: string;
  cityState: CityState; borderColor: string; score: number;
}) {
  const metrics = [
    { label: "Trees",   value: cityState.treeCount,               icon: "🌳" },
    { label: "Air",     value: 100 - cityState.pollutionLevel,     icon: "💨" },
    { label: "Water",   value: cityState.waterClarity,             icon: "💧" },
    { label: "Life",    value: cityState.biodiversity,             icon: "🦋" },
    { label: "Energy",  value: cityState.renewableEnergy,          icon: "⚡" },
  ];

  const scoreColor = score >= 60 ? "var(--green)" : score >= 35 ? "#86efac" : "#6b7280";

  return (
    <div style={{ background: "var(--surface-2)", border: `1px solid ${borderColor}`, borderRadius: 20, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border)" }}>
        <span style={{
          fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          color: tagColor, background: `${tagColor}15`,
          border: `1px solid ${tagColor}30`,
          padding: "3px 10px", borderRadius: 4, display: "inline-block", marginBottom: 12,
        }}>{tag}</span>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</h3>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: "2.5rem", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>/ 100 world score</span>
        </div>
      </div>

      {/* 3D City */}
      <div style={{ height: 300, background: "#0a0a0a" }}>
        <City3D cityState={cityState} interactive={false} cameraPosition={[7, 5, 7]} />
      </div>

      {/* Metrics */}
      <div style={{ padding: "20px 28px" }}>
        {metrics.map((m, i) => {
          const color = m.value >= 60 ? "var(--green)" : m.value >= 35 ? "#86efac" : "#6b7280";
          return (
            <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < metrics.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: "0.9rem", width: 20, flexShrink: 0 }}>{m.icon}</span>
              <span style={{ fontSize: "0.875rem", color: "var(--text-dim)", flex: 1 }}>{m.label}</span>
              <div style={{ width: 80, height: 3, background: "var(--surface-3)", borderRadius: 2, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }}
                  transition={{ duration: 1.1, ease: "easeOut", delay: i * 0.08 }}
                  style={{ height: "100%", background: color, borderRadius: 2 }}
                />
              </div>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color, width: 36, textAlign: "right" }}>
                {m.value}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Improvement tip ─────────────────────────────────────────────── */
function Tip({ index, tip, impact }: { index: number; tip: string; impact: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      style={{
        display: "flex", gap: 14, alignItems: "flex-start",
        padding: "16px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        fontSize: "0.8125rem", fontWeight: 700, color: "var(--green)",
      }}>
        {index + 1}
      </div>
      <div>
        <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6, marginBottom: 3 }}>{tip}</p>
        <p style={{ fontSize: "0.8rem", color: "var(--green)", fontWeight: 500 }}>{impact}</p>
      </div>
    </motion.div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function FuturePage() {
  const { cityState, activities, getCityStateForScore } = useTerraStore();

  const currentFuture = useMemo(() => getCityStateForScore(Math.max(0, cityState.overallScore - 18)), [cityState, getCityStateForScore]);
  const improvedFuture = useMemo(() => getCityStateForScore(Math.min(100, cityState.overallScore + 22)), [cityState, getCityStateForScore]);

  const scoreDiff = improvedFuture.overallScore - currentFuture.overallScore;

  const TIPS = [
    { tip: "Replace one beef meal per week with a plant-based alternative.", impact: "Saves ~150 kg CO₂e per year" },
    { tip: "Use public transport or cycle for commutes under 5 km.", impact: "Reduces transport emissions by up to 70%" },
    { tip: "Switch to a renewable energy provider for your home.", impact: "Eliminates ~1.5 tonnes CO₂e annually" },
    { tip: "Carry a reusable bag, bottle, and coffee cup daily.", impact: "Prevents ~300 single-use items per year" },
    { tip: "Choose second-hand or sustainable brands when shopping.", impact: "Cuts fashion carbon footprint by 60–80%" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "var(--black)" }}>
      <Navigation />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 24px 80px" }}>

        {/* ── PAGE HEADER ──────────────────────────────────── */}
        <div style={{ marginBottom: 48, paddingBottom: 28, borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green)", marginBottom: 8 }}>
            Feature 04
          </p>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "#fff", marginBottom: 8 }}>
            Your Future Starts Today.
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--text-dim)", maxWidth: 520 }}>
            Two possible worlds based on your current habits. The choice between them starts now.
          </p>
        </div>

        {/* ── CONTEXT BAR ──────────────────────────────────── */}
        <div style={{
          background: "var(--surface-2)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "20px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 20, marginBottom: 36,
        }}>
          {[
            { label: "Current Score",     value: `${cityState.overallScore} / 100`, color: "var(--green)" },
            { label: "Activities Logged", value: activities.length.toString() },
            { label: "Without Change",    value: `${currentFuture.overallScore} pts`, color: "#6b7280" },
            { label: "With Better Habits", value: `${improvedFuture.overallScore} pts`, color: "var(--green)" },
            { label: "Potential Gain",    value: `+${scoreDiff} pts`, color: "var(--green)" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color || "#fff", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── SIDE-BY-SIDE CITIES ──────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 48 }}>
          <FutureColumn
            title="Current Path"
            tag="Without Change"
            tagColor="#6b7280"
            cityState={currentFuture}
            borderColor="var(--border)"
            score={currentFuture.overallScore}
          />
          <FutureColumn
            title="Improved Future"
            tag="With Better Habits"
            tagColor="var(--green)"
            cityState={improvedFuture}
            borderColor="rgba(34,197,94,0.3)"
            score={improvedFuture.overallScore}
          />
        </div>

        {/* ── DIFFERENCE CALLOUT ───────────────────────────── */}
        <div style={{
          background: "var(--surface-2)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "32px 36px",
          marginBottom: 48,
          display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 32, alignItems: "center",
        }}>
          <div>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
              Without change
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "Trees",  val: `${currentFuture.treeCount}%` },
                { label: "Air",    val: `${100 - currentFuture.pollutionLevel}%` },
                { label: "Score",  val: currentFuture.overallScore },
              ].map((m) => (
                <div key={m.label}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#6b7280" }}>{m.val}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "0 8px" }}>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--green)", lineHeight: 1 }}>+{scoreDiff}</div>
            <div style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 4 }}>
              Point difference
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green)", marginBottom: 8 }}>
              With better habits
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "flex-end" }}>
              {[
                { label: "Trees",  val: `${improvedFuture.treeCount}%` },
                { label: "Air",    val: `${100 - improvedFuture.pollutionLevel}%` },
                { label: "Score",  val: improvedFuture.overallScore },
              ].map((m) => (
                <div key={m.label} style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--green)" }}>{m.val}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── HOW TO GET THERE ─────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
          <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              How to build the better future
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-dim)", marginBottom: 20 }}>
              Five habits that would meaningfully shift your trajectory
            </p>
            <div>
              {TIPS.map((tip, i) => <Tip key={i} index={i} tip={tip.tip} impact={tip.impact} />)}
            </div>
          </div>

          {/* Right CTA */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 14, padding: "24px",
            }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.3 }}>
                Every activity you log moves the needle.
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-dim)", lineHeight: 1.65, marginBottom: 20 }}>
                Start building the improved future by logging your next sustainable choice.
              </p>
              <Link href="/carbon" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Log an Activity →
              </Link>
            </div>
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff", marginBottom: 8 }}>
                See your full history
              </h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-dim)", marginBottom: 16, lineHeight: 1.6 }}>
                Review all your past activities and their impact scores.
              </p>
              <Link href="/history" className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                View History →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
