"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useTerraStore } from "@/store/useTerraStore";
import { useUserStore } from "@/store/useUserStore";
import { computeRules, scoreTier } from "@/lib/cityRules";
import type { Activity } from "@/store/useTerraStore";

const City3D = dynamic(() => import("@/components/City3D"), { ssr: false });

// ── Mock activity presets ──────────────────────────────────────────
const MOCK_ACTIVITIES: { label: string; emoji: string; score: number; carbon: number; impact: "positive" | "negative" | "neutral"; category: string; note: string }[] = [
  { label: "Cycling to work",        emoji: "🚲", score: 95, carbon: 0,    impact: "positive", category: "Transport", note: "Cycled 8km to work this morning" },
  { label: "Vegan meal",             emoji: "🌱", score: 88, carbon: 0.4,  impact: "positive", category: "Food",      note: "Vegan lunch at the canteen" },
  { label: "Metro ride",             emoji: "🚇", score: 80, carbon: 0.15, impact: "positive", category: "Transport", note: "Took the metro to college" },
  { label: "Plant groceries",        emoji: "🥦", score: 74, carbon: 1.1,  impact: "positive", category: "Food",      note: "Weekly vegetable grocery run" },
  { label: "Work from home",         emoji: "🏠", score: 65, carbon: 1.8,  impact: "neutral",  category: "Energy",    note: "Full day working from home" },
  { label: "Mixed groceries",        emoji: "🛒", score: 52, carbon: 3.2,  impact: "neutral",  category: "Food",      note: "Grocery shopping, mixed items" },
  { label: "Car commute 20km",       emoji: "🚗", score: 35, carbon: 4.4,  impact: "negative", category: "Transport", note: "Drove to office 20km each way" },
  { label: "Beef burger meal",       emoji: "🍔", score: 28, carbon: 4.8,  impact: "negative", category: "Food",      note: "Double beef burger for lunch" },
  { label: "New clothes purchase",   emoji: "🛍", score: 22, carbon: 14,   impact: "negative", category: "Shopping",  note: "Bought 3 new outfits" },
  { label: "Electricity bill",       emoji: "⚡", score: 35, carbon: 85,   impact: "negative", category: "Energy",    note: "Monthly electricity bill, heavy usage" },
  { label: "Plastic bottles × 5",   emoji: "🍶", score: 18, carbon: 0.9,  impact: "negative", category: "Waste",     note: "Bought 5 plastic water bottles" },
  { label: "Long-haul flight",       emoji: "✈️", score: 8,  carbon: 450,  impact: "negative", category: "Transport", note: "Return flight Mumbai to London" },
];

// ── Tiny stat pill ─────────────────────────────────────────────────
function Pill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", minWidth: 70 }}>
      <div style={{ fontSize: "1rem", fontWeight: 700, color: color || "#fff", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 3 }}>{label}</div>
    </div>
  );
}

// ── Activity badge ─────────────────────────────────────────────────
function ActivityBadge({ a, onRemove }: { a: Activity & { emoji?: string }; onRemove: () => void }) {
  const c = a.impact === "positive" ? "var(--green)" : a.impact === "negative" ? "#f87171" : "var(--text-dim)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 6 }}>
      <span style={{ fontSize: "1.1rem" }}>{(a as { emoji?: string }).emoji || "📋"}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.78rem", fontWeight: 500, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.note}</p>
        <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 1 }}>{a.category} · {a.carbonEstimate}kg</p>
      </div>
      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: c, flexShrink: 0 }}>{a.sustainabilityScore}</span>
      <button onClick={onRemove} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.7rem", padding: "0 2px" }}>✕</button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export default function TestCityPage() {
  const { activities, addActivity, removeActivity, cityState, initForUser } = useTerraStore();
  const { setProfile, isLoggedIn } = useUserStore();

  // Auto-create dev user
  useEffect(() => {
    if (!isLoggedIn) {
      const phone = "+910000000001";
      setProfile({ name: "Test User", phone, email: "", age: "", city: "Mumbai", country: "India", occupation: "Tester", bio: "", diet: "omnivore", transport: "mixed", energy: "grid", weeklyGoal: 65, carbonBudget: 20, avatar: "#22c55e", joinedAt: new Date().toISOString() });
      initForUser(phone);
    }
  }, [isLoggedIn, setProfile, initForUser]);

  // Manual score override for demo slider
  const [manualScore, setManualScore] = useState<number | null>(null);
  const [autoPlay, setAutoPlay]       = useState(false);
  const [autoDir, setAutoDir]         = useState(1);  // 1=up, -1=down
  const animRef = useRef<number>(0);
  const lastTime = useRef<number>(0);

  // Computed score: manual override OR derived from activities
  const derivedScore = cityState.overallScore;
  const displayScore = manualScore !== null ? manualScore : derivedScore;
  const rules        = computeRules(displayScore);
  const tier         = scoreTier(displayScore);

  // Auto-play animation: sweep score up and down
  useEffect(() => {
    if (!autoPlay) { cancelAnimationFrame(animRef.current); return; }
    const tick = (t: number) => {
      if (t - lastTime.current > 80) {  // ~12 fps sweep
        lastTime.current = t;
        setManualScore((prev) => {
          const cur = prev ?? displayScore;
          const next = cur + autoDir;
          if (next >= 100) { setAutoDir(-1); return 100; }
          if (next <= 0)   { setAutoDir(1);  return 0;   }
          return next;
        });
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [autoPlay, autoDir, displayScore]);

  const addMock = (m: typeof MOCK_ACTIVITIES[0]) => {
    const act: Activity & { emoji: string } = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      imageDataUrl: null,
      note: m.note,
      category: m.category,
      impact: m.impact,
      carbonEstimate: m.carbon,
      sustainabilityScore: m.score,
      recommendation: "",
      environmentalImpact: "",
      emoji: m.emoji,
    };
    addActivity(act as Activity);
    setManualScore(null); // switch to live derived score
  };

  const clearAll = () => {
    [...activities].forEach((a) => removeActivity(a.id));
    setManualScore(null);
  };

  const scoreColor = tier.color;

  // City state for 3D — use manual score if set
  const cityStateForRender = manualScore !== null
    ? { ...cityState, overallScore: manualScore,
        treeCount: rules.treeCount,
        pollutionLevel: Math.round((1 - manualScore / 100) * 90),
        greenness: Math.round(10 + (manualScore / 100) * 90),
        waterClarity: Math.round(20 + (manualScore / 100) * 80),
        biodiversity: Math.round(10 + (manualScore / 100) * 90),
        renewableEnergy: Math.round((manualScore / 100) * 100) }
    : cityState;

  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", color: "#fff" }}>
      {/* Header */}
      <div style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green)" }}>TerraBloom</span>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.015em", marginTop: 2 }}>City Rendering Test Lab</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ background: "var(--surface-3)", border: `2px solid ${scoreColor}`, borderRadius: 10, padding: "6px 16px", textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{displayScore}</div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Score</div>
          </div>
          <div style={{ background: "var(--surface-3)", border: `1px solid ${scoreColor}30`, borderRadius: 10, padding: "6px 16px", textAlign: "center" }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: scoreColor }}>{tier.label}</div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Tier</div>
          </div>
          {manualScore !== null && (
            <span style={{ fontSize: "0.72rem", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", borderRadius: 6, padding: "4px 10px", fontWeight: 600 }}>
              MANUAL MODE
            </span>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", height: "calc(100vh - 70px)" }}>

        {/* LEFT: 3D city + score slider */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* 3D City */}
          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            <City3D cityState={cityStateForRender} interactive={true} cameraPosition={[11, 8, 11]} />

            {/* Score tier overlay */}
            <div style={{ position: "absolute", top: 14, left: 14, background: "var(--surface-2)", border: `1px solid ${scoreColor}40`, borderRadius: 10, padding: "8px 14px" }}>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>City Tier</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: scoreColor, marginTop: 2 }}>{tier.label}</div>
            </div>

            {/* Live rules overlay */}
            <div style={{ position: "absolute", top: 14, right: 14, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: "0.72rem", color: "var(--text-dim)", lineHeight: 1.8, minWidth: 140 }}>
              <div>🌳 Trees: <strong style={{ color: "#fff" }}>{rules.treeCount}</strong></div>
              <div>🏢 Buildings: <strong style={{ color: "#fff" }}>{rules.buildingCount}</strong></div>
              <div>🌬 Turbines: <strong style={{ color: "#fff" }}>{rules.turbineCount}</strong></div>
              <div>☀️ Solar: <strong style={{ color: "#fff" }}>{rules.solarFieldCount}</strong></div>
              <div>☁️ Haze: <strong style={{ color: "#fff" }}>{(rules.hazeOpacity * 100).toFixed(0)}%</strong></div>
              <div>💧 Lake r: <strong style={{ color: "#fff" }}>{rules.lakeRadius.toFixed(2)}</strong></div>
              <div>✨ Particles: <strong style={{ color: "#fff" }}>{rules.particleCount}</strong></div>
              <div>📐 Spread: <strong style={{ color: "#fff" }}>{rules.buildingSpread.toFixed(1)}u</strong></div>
            </div>
          </div>

          {/* Score slider */}
          <div style={{ background: "var(--surface-2)", borderTop: "1px solid var(--border)", padding: "14px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Manual Score Override
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setManualScore(0); setAutoPlay(false); }}
                  style={{ fontSize: "0.72rem", padding: "4px 10px", background: "var(--surface-3)", border: "1px solid var(--border)", color: "#f87171", borderRadius: 6, cursor: "pointer" }}>
                  Set 0
                </button>
                <button onClick={() => { setManualScore(50); setAutoPlay(false); }}
                  style={{ fontSize: "0.72rem", padding: "4px 10px", background: "var(--surface-3)", border: "1px solid var(--border)", color: "#fbbf24", borderRadius: 6, cursor: "pointer" }}>
                  Set 50
                </button>
                <button onClick={() => { setManualScore(100); setAutoPlay(false); }}
                  style={{ fontSize: "0.72rem", padding: "4px 10px", background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--green)", borderRadius: 6, cursor: "pointer" }}>
                  Set 100
                </button>
                <button onClick={() => { setAutoPlay(!autoPlay); if (!autoPlay) setManualScore(manualScore ?? displayScore); }}
                  style={{ fontSize: "0.72rem", padding: "4px 10px", background: autoPlay ? "rgba(34,197,94,0.15)" : "var(--surface-3)", border: autoPlay ? "1px solid var(--green)" : "1px solid var(--border)", color: autoPlay ? "var(--green)" : "var(--text-dim)", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                  {autoPlay ? "⏹ Stop" : "▶ Auto-sweep"}
                </button>
                <button onClick={() => setManualScore(null)}
                  style={{ fontSize: "0.72rem", padding: "4px 10px", background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: 6, cursor: "pointer" }}>
                  Use Live
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "0.7rem", color: "#f87171", fontWeight: 600, width: 20 }}>0</span>
              <input type="range" min={0} max={100} step={1}
                value={manualScore ?? displayScore}
                onChange={(e) => { setAutoPlay(false); setManualScore(Number(e.target.value)); }}
                style={{ flex: 1, accentColor: scoreColor, cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.7rem", color: "var(--green)", fontWeight: 600, width: 24, textAlign: "right" }}>100</span>
            </div>

            {/* Tier markers */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingLeft: 28, paddingRight: 28 }}>
              {[
                { score: 0,   label: "Critical",   color: "#f87171" },
                { score: 20,  label: "Struggling",  color: "#fbbf24" },
                { score: 40,  label: "Neutral",     color: "#a3a3a3" },
                { score: 60,  label: "Growing",     color: "#86efac" },
                { score: 80,  label: "Thriving",    color: "#22c55e" },
              ].map((t) => (
                <button key={t.score} onClick={() => { setAutoPlay(false); setManualScore(t.score); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.62rem", color: t.color, fontWeight: displayScore >= t.score ? 700 : 400, opacity: displayScore >= t.score ? 1 : 0.4, padding: "2px 4px" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: controls */}
        <div style={{ borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Live stats strip */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill label="Activities" value={activities.length} />
            <Pill label="Avg Score" value={derivedScore} color={tier.color} />
            <Pill label="Carbon" value={`${Math.round(activities.reduce((s,a) => s + a.carbonEstimate, 0) * 10) / 10}kg`} />
            <Pill label="Positive" value={activities.filter(a => a.impact === "positive").length} color="var(--green)" />
            <Pill label="Negative" value={activities.filter(a => a.impact === "negative").length} color="#f87171" />
          </div>

          {/* Mock activity buttons */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", overflowY: "auto", flex: "0 0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Add Mock Activity
              </span>
              <button onClick={clearAll}
                style={{ fontSize: "0.68rem", padding: "3px 8px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 5, cursor: "pointer" }}>
                Clear All
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {MOCK_ACTIVITIES.map((m) => {
                const c = m.impact === "positive" ? "var(--green)" : m.impact === "negative" ? "#f87171" : "var(--text-dim)";
                return (
                  <button key={m.label} onClick={() => addMock(m)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px",
                    background: "var(--surface-3)", border: "1px solid var(--border)",
                    borderRadius: 8, cursor: "pointer", textAlign: "left",
                    transition: "border-color 0.15s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = c)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{m.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.78rem", fontWeight: 500, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.label}</p>
                      <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 1 }}>{m.carbon}kg CO₂ · score {m.score}</p>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: c, flexShrink: 0 }}>{m.impact === "positive" ? "+" : m.impact === "negative" ? "−" : "~"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logged activities */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Logged ({activities.length})
              </span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px" }}>
              {activities.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", marginTop: 24 }}>
                  Add mock activities above to see the city change
                </p>
              ) : (
                [...activities].reverse().map((a) => (
                  <ActivityBadge key={a.id} a={a as Activity & { emoji?: string }} onRemove={() => removeActivity(a.id)} />
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
