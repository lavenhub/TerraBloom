"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import Navigation from "@/components/Navigation";
import { useTerraStore } from "@/store/useTerraStore";
import type { Activity } from "@/store/useTerraStore";

const Calendar  = dynamic(() => import("react-calendar").then((m) => m.Calendar), { ssr: false });

type CalVal = Date | [Date | null, Date | null] | null;

/* ── Activity row ────────────────────────────────────────────────── */
function ActivityRow({ activity, onDelete }: { activity: Activity; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);

  const impactColor =
    activity.impact === "positive" ? "var(--green)" :
    activity.impact === "negative" ? "#f87171"       : "var(--text-dim)";

  const scoreColor =
    activity.sustainabilityScore >= 70 ? "var(--green)" :
    activity.sustainabilityScore >= 40 ? "#86efac"      : "#6b7280";

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", background: "none", border: "none",
          borderBottom: "1px solid var(--border)",
          padding: "14px 0", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 14, textAlign: "left",
        }}
      >
        {/* Thumbnail */}
        {activity.imageDataUrl ? (
          <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0, position: "relative" }}>
            <Image src={activity.imageDataUrl} alt="" fill style={{ objectFit: "cover" }} />
          </div>
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--surface-3)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "1.25rem" }}>📋</span>
          </div>
        )}

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{
              fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase", color: "var(--green)",
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.15)",
              padding: "2px 7px", borderRadius: 3,
            }}>{activity.category}</span>
            <span style={{ fontSize: "0.75rem", color: impactColor, fontWeight: 500, textTransform: "capitalize" }}>
              {activity.impact}
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activity.note || "No description"}
          </p>
        </div>

        {/* Score + time */}
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <div style={{ fontSize: "1.125rem", fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
            {activity.sustainabilityScore}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </div>
        </div>

        {/* Expand chevron */}
        <span style={{
          fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }}>▾</span>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              background: "var(--surface-3)", borderRadius: 10,
              padding: "16px 18px", margin: "4px 0 12px",
              border: "1px solid var(--border)",
            }}>
              {/* Carbon + score row */}
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{activity.carbonEstimate}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>kg CO₂e</div>
                </div>
                <div style={{ flex: 1, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: scoreColor }}>{activity.sustainabilityScore}/100</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>Sustainability</div>
                </div>
                <div style={{ flex: 1, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: impactColor, textTransform: "capitalize" }}>{activity.impact}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>Impact</div>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ height: 3, background: "var(--surface-2)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${activity.sustainabilityScore}%`, background: scoreColor, borderRadius: 2 }} />
                </div>
              </div>

              {activity.environmentalImpact && (
                <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 10 }}>
                  {activity.environmentalImpact}
                </p>
              )}

              {activity.recommendation && (
                <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                  <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                    💡 {activity.recommendation}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {format(new Date(activity.timestamp), "MMM d, yyyy · HH:mm")}
                </span>
                <button
                  onClick={() => onDelete(activity.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "rgba(248,113,113,0.5)", padding: "4px 8px" }}
                >
                  Remove
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
/**
 * HistoryPage — Day-by-Day Record
 * 
 * Displays a calendar view and list view of all logged activities.
 */
export default function HistoryPage() {
  const { activities, removeActivity } = useTerraStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<"calendar" | "all">("all");

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const dayActivities = activities.filter((a) => a.timestamp.split("T")[0] === dateStr);

  const totalCarbon = activities.reduce((s, a) => s + a.carbonEstimate, 0);
  const avgScore = activities.length
    ? Math.round(activities.reduce((s, a) => s + a.sustainabilityScore, 0) / activities.length)
    : 0;
  const positiveCount = activities.filter((a) => a.impact === "positive").length;

  // Dates with activity
  const activeDates = new Set(activities.map((a) => a.timestamp.split("T")[0]));

  const tileContent = ({ date }: { date: Date }) => {
    const d = format(date, "yyyy-MM-dd");
    if (!activeDates.has(d)) return null;
    const acts = activities.filter((a) => a.timestamp.split("T")[0] === d);
    const s = acts.reduce((sum, a) => sum + a.sustainabilityScore, 0) / acts.length;
    const color = s >= 60 ? "var(--green)" : s >= 40 ? "#86efac" : "#6b7280";
    return <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, margin: "2px auto 0" }} />;
  };

  const displayActivities = activeTab === "calendar" ? dayActivities : activities;

  return (
    <main id="main-content" style={{ minHeight: "100vh", background: "var(--black)" }}>
      <Navigation />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 24px 80px" }}>

        {/* ── PAGE HEADER ──────────────────────────────────── */}
        <div style={{ marginBottom: 36, paddingBottom: 28, borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green)", marginBottom: 8 }}>
            Feature 03
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "#fff" }}>
                History
              </h1>
              <p style={{ fontSize: "1rem", color: "var(--text-dim)", marginTop: 6 }}>
                Every activity, every day. Select a date to see your impact.
              </p>
            </div>
            <Link href="/carbon" className="btn-primary">Log Activity →</Link>
          </div>
        </div>

        {/* ── STATS STRIP ──────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { label: "Total Activities", value: activities.length,   color: "#fff" },
            { label: "Average Score",    value: avgScore,            color: avgScore >= 60 ? "var(--green)" : "#86efac" },
            { label: "Total Carbon",     value: `${Math.round(totalCarbon * 10) / 10} kg`, color: "#fff" },
            { label: "Positive Days",    value: positiveCount,       color: "var(--green)" },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TAB SWITCHER ─────────────────────────────────── */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid var(--border)" }}>
          {(["all", "calendar"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "10px 20px",
                fontSize: "0.875rem", fontWeight: 500,
                color: activeTab === tab ? "#fff" : "var(--text-dim)",
                borderBottom: activeTab === tab ? "2px solid var(--green)" : "2px solid transparent",
                marginBottom: -1,
                transition: "all 0.15s ease",
                textTransform: "capitalize",
              }}
            >
              {tab === "all" ? `All Activities (${activities.length})` : "Calendar View"}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: activeTab === "calendar" ? "340px 1fr" : "1fr", gap: 24, alignItems: "start" }}>

          {/* Calendar panel — only on calendar tab */}
          {activeTab === "calendar" && (
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 }}>
                  Select a day
                </p>
                <Calendar
                  value={selectedDate}
                  onChange={(val: CalVal) => { if (val instanceof Date) setSelectedDate(val); }}
                  tileContent={tileContent}
                />
                {/* Legend */}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { color: "var(--green)", label: "Positive day" },
                    { color: "#86efac",      label: "Neutral day" },
                    { color: "#6b7280",      label: "Negative day" },
                  ].map((l) => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected day summary */}
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginTop: 12 }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                  {format(selectedDate, "MMMM d, yyyy")}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-dim)" }}>
                  {dayActivities.length} {dayActivities.length === 1 ? "activity" : "activities"} logged
                </p>
                {dayActivities.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-dim)" }}>
                      Carbon: <strong style={{ color: "#fff" }}>{Math.round(dayActivities.reduce((s, a) => s + a.carbonEstimate, 0) * 10) / 10} kg</strong>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Activity list */}
          <div>
            {displayActivities.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px" }}>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>📋</div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff", marginBottom: 8 }}>
                  {activeTab === "calendar"
                    ? `No activities on ${format(selectedDate, "MMMM d")}`
                    : "No activities yet"}
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-dim)", marginBottom: 24 }}>
                  {activities.length === 0
                    ? "Start logging your daily choices to build your history."
                    : "Try another date."}
                </p>
                {activities.length === 0 && (
                  <Link href="/carbon" className="btn-primary">Log First Activity →</Link>
                )}
              </div>
            ) : (
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "0 24px" }}>
                <AnimatePresence mode="popLayout">
                  {displayActivities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ActivityRow activity={activity} onDelete={removeActivity} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
