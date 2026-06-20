"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import Navigation from "@/components/Navigation";
import { useUserStore } from "@/store/useUserStore";
import { useTerraStore } from "@/store/useTerraStore";
import type { DietType, TransportType, EnergyType } from "@/store/useUserStore";

/* ── helpers ─────────────────────────────────────────────────── */
function initials(name: string) {
  return name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "TB";
}

function Row({ label, value, green }: { label: string; value: string | number; green?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: "0.875rem", color: "var(--text-dim)" }}>{label}</span>
      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: green ? "var(--green)" : "#fff" }}>{value}</span>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 0, marginTop: 28 }}>
      {title}
    </p>
  );
}

type TabId = "overview" | "lifestyle" | "goals" | "edit";

/* ── page ────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter();
  const { profile, logout, updateProfile, isLoggedIn } = useUserStore();
  const { activities, cityState, initForUser, resetStore } = useTerraStore();
  const [tab, setTab] = useState<TabId>("overview");
  const [editForm, setEditForm] = useState(profile ?? {});
  const [saved, setSaved] = useState(false);

  // Ensure TerraStore is bound to the correct user on mount
  useEffect(() => {
    if (isLoggedIn && profile?.phone) {
      initForUser(profile.phone);
    }
  }, [isLoggedIn, profile?.phone, initForUser]);

  if (!isLoggedIn || !profile) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--black)" }}>
        <Navigation />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "140px 24px", textAlign: "center" }}>
          <p style={{ color: "var(--text-dim)", marginBottom: 24 }}>You need to log in first.</p>
          <button onClick={() => router.push("/login")} className="btn-primary">Go to Login →</button>
        </div>
      </main>
    );
  }

  const totalCarbon = Math.round(activities.reduce((s, a) => s + a.carbonEstimate, 0) * 10) / 10;
  const avgScore = activities.length
    ? Math.round(activities.reduce((s, a) => s + a.sustainabilityScore, 0) / activities.length)
    : 0;
  const positiveCount = activities.filter((a) => a.impact === "positive").length;
  const joinedDate = profile.joinedAt ? format(new Date(profile.joinedAt), "MMMM yyyy") : "—";

  const dietIcon: Record<DietType, string> = { omnivore: "🍖", vegetarian: "🥗", vegan: "🌱", pescatarian: "🐟" };
  const transportIcon: Record<TransportType, string> = { car: "🚗", public: "🚇", cycle: "🚲", walk: "🚶", mixed: "🔀" };
  const energyIcon: Record<EnergyType, string> = { grid: "⚡", renewable: "☀️", mixed: "🔀" };

  const scoreColor = (s: number) => s >= 70 ? "var(--green)" : s >= 40 ? "#86efac" : "#6b7280";

  const handleSave = () => {
    updateProfile(editForm as Parameters<typeof updateProfile>[0]);
    setSaved(true);
    setTimeout(() => { setSaved(false); setTab("overview"); }, 1200);
  };

  const TABS: { id: TabId; label: string }[] = [
    { id: "overview",  label: "Overview" },
    { id: "lifestyle", label: "Lifestyle" },
    { id: "goals",     label: "Goals" },
    { id: "edit",      label: "Edit Profile" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "var(--black)" }}>
      <Navigation />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "90px 24px 80px" }}>

        {/* ── PROFILE HEADER ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: "var(--surface-2)", border: "1px solid var(--border)",
            borderRadius: 20, padding: "36px",
            display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 88, height: 88, borderRadius: "50%",
            background: profile.avatar || "var(--green)",
            border: "3px solid var(--border-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", fontWeight: 700, color: "#000", flexShrink: 0,
          }}>
            {initials(profile.name)}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 4 }}>
              {profile.name}
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-dim)", marginBottom: 10 }}>
              {[profile.occupation, profile.city, profile.country].filter(Boolean).join(" · ")}
            </p>
            {profile.bio && (
              <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 400 }}>
                {profile.bio}
              </p>
            )}
          </div>

          {/* Score badge */}
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              border: `3px solid ${scoreColor(cityState.overallScore)}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: scoreColor(cityState.overallScore), lineHeight: 1 }}>
                {cityState.overallScore}
              </span>
              <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                score
              </span>
            </div>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 6 }}>World Score</p>
          </div>
        </motion.div>

        {/* ── STATS STRIP ──────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Joined",       value: joinedDate,      color: "#fff" },
            { label: "Activities",   value: activities.length, color: "#fff" },
            { label: "Avg Score",    value: avgScore,         color: scoreColor(avgScore) },
            { label: "Total Carbon", value: `${totalCarbon}kg`, color: "#fff" },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TABS ─────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 0 }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 20px", fontSize: "0.875rem", fontWeight: 500,
              color: tab === t.id ? "#fff" : "var(--text-dim)",
              borderBottom: tab === t.id ? "2px solid var(--green)" : "2px solid transparent",
              marginBottom: -1, transition: "all 0.15s ease",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ──────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >

            {/* OVERVIEW ────────────────────────────────────── */}
            {tab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 20 }}>
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
                  <SectionHead title="Personal" />
                  <Row label="Full Name"    value={profile.name} />
                  <Row label="Phone"        value={profile.phone} />
                  <Row label="Email"        value={profile.email || "—"} />
                  <Row label="Age"          value={profile.age || "—"} />
                  <Row label="Occupation"   value={profile.occupation || "—"} />
                  <Row label="City"         value={profile.city} />
                  <Row label="Country"      value={profile.country} />
                </div>

                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
                  <SectionHead title="City Vitals" />
                  <Row label="World Score"     value={cityState.overallScore} green />
                  <Row label="Tree Coverage"   value={`${cityState.treeCount}%`} green />
                  <Row label="Air Quality"     value={`${100 - cityState.pollutionLevel}%`} />
                  <Row label="Water Clarity"   value={`${cityState.waterClarity}%`} />
                  <Row label="Biodiversity"    value={`${cityState.biodiversity}%`} />
                  <Row label="Renewable Energy" value={`${cityState.renewableEnergy}%`} green />
                  <SectionHead title="Activity Stats" />
                  <Row label="Total Activities"  value={activities.length} />
                  <Row label="Positive Actions"  value={positiveCount} green />
                  <Row label="Total Carbon"      value={`${totalCarbon} kg CO₂e`} />
                  <Row label="Average Score"     value={avgScore} green={avgScore >= 60} />
                </div>
              </div>
            )}

            {/* LIFESTYLE ───────────────────────────────────── */}
            {tab === "lifestyle" && (
              <div style={{ paddingTop: 20 }}>
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px", maxWidth: 540 }}>
                  <SectionHead title="Lifestyle Profile" />

                  {[
                    { label: "Diet", icon: dietIcon[profile.diet], value: profile.diet.charAt(0).toUpperCase() + profile.diet.slice(1) },
                    { label: "Main Transport", icon: transportIcon[profile.transport], value: profile.transport.charAt(0).toUpperCase() + profile.transport.slice(1) },
                    { label: "Home Energy", icon: energyIcon[profile.energy], value: profile.energy.charAt(0).toUpperCase() + profile.energy.slice(1) },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "0.875rem", color: "var(--text-dim)" }}>{item.label}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>
                        {item.icon} {item.value}
                      </span>
                    </div>
                  ))}

                  {/* Carbon impact of lifestyle */}
                  <div style={{ marginTop: 24, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10, padding: "16px" }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--green)", fontWeight: 600, marginBottom: 6 }}>Lifestyle Carbon Impact</p>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-dim)", lineHeight: 1.65 }}>
                      {profile.diet === "vegan" ? "Your vegan diet saves ~1.5 tonnes CO₂e per year vs average." :
                       profile.diet === "vegetarian" ? "Your vegetarian diet saves ~0.9 tonnes CO₂e vs omnivore average." :
                       "Reducing beef consumption by 50% could save ~0.6 tonnes CO₂e per year."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* GOALS ───────────────────────────────────────── */}
            {tab === "goals" && (
              <div style={{ paddingTop: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 700 }}>
                  {/* Weekly score goal */}
                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px" }}>
                    <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 }}>
                      Sustainability Target
                    </p>
                    <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--green)", lineHeight: 1, marginBottom: 4 }}>
                      {profile.weeklyGoal}
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-dim)", marginBottom: 20 }}>Target score per week</p>
                    {/* Progress vs current */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 6 }}>
                        <span>Current avg</span>
                        <span style={{ color: scoreColor(avgScore) }}>{avgScore}</span>
                      </div>
                      <div style={{ height: 4, background: "var(--surface-3)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min((avgScore / profile.weeklyGoal) * 100, 100)}%`, background: "var(--green)", borderRadius: 2 }} />
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8 }}>
                        {avgScore >= profile.weeklyGoal ? "✓ Goal reached!" : `${profile.weeklyGoal - avgScore} pts to reach your goal`}
                      </p>
                    </div>
                  </div>

                  {/* Carbon budget */}
                  <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px" }}>
                    <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 }}>
                      Weekly Carbon Budget
                    </p>
                    <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--green)", lineHeight: 1, marginBottom: 4 }}>
                      {profile.carbonBudget}
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-dim)", marginBottom: 20 }}>kg CO₂e per week</p>
                    {/* Weekly carbon usage */}
                    {(() => {
                      const weeklyCarbon = activities
                        .filter((a) => {
                          const d = new Date(a.timestamp);
                          const now = new Date();
                          return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
                        })
                        .reduce((s, a) => s + a.carbonEstimate, 0);
                      const pct = Math.min((weeklyCarbon / profile.carbonBudget) * 100, 100);
                      return (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 6 }}>
                            <span>This week</span>
                            <span style={{ color: weeklyCarbon > profile.carbonBudget ? "#f87171" : "var(--green)" }}>
                              {Math.round(weeklyCarbon * 10) / 10} kg
                            </span>
                          </div>
                          <div style={{ height: 4, background: "var(--surface-3)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: weeklyCarbon > profile.carbonBudget ? "#f87171" : "var(--green)", borderRadius: 2 }} />
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8 }}>
                            {weeklyCarbon > profile.carbonBudget ? "⚠ Over budget this week" : `${Math.round((profile.carbonBudget - weeklyCarbon) * 10) / 10} kg remaining`}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* EDIT ─────────────────────────────────────────── */}
            {tab === "edit" && (
              <div style={{ paddingTop: 20, maxWidth: 540 }}>
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px" }}>

                  {/* Name + email */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>Full Name</label>
                    <input type="text" className="input" value={(editForm as typeof profile).name ?? ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>Email</label>
                    <input type="email" className="input" value={(editForm as typeof profile).email ?? ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>City</label>
                      <input type="text" className="input" value={(editForm as typeof profile).city ?? ""} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>Occupation</label>
                      <input type="text" className="input" value={(editForm as typeof profile).occupation ?? ""} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>Bio</label>
                    <textarea className="input" rows={3} value={(editForm as typeof profile).bio ?? ""} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
                  </div>

                  <button onClick={handleSave} className="btn-primary" style={{ width: "100%", padding: "13px" }}>
                    {saved ? "✓ Saved!" : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── LOGOUT ───────────────────────────────────────── */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => { resetStore(); logout(); router.push("/login"); }}
            style={{
              background: "none", border: "1px solid rgba(248,113,113,0.2)",
              color: "#f87171", borderRadius: 8, padding: "9px 20px",
              fontSize: "0.875rem", cursor: "pointer", fontWeight: 500,
            }}
          >
            Log Out
          </button>
        </div>

      </div>
    </main>
  );
}
