"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { useTerraStore } from "@/store/useTerraStore";

const City3D = dynamic(() => import("@/components/City3D"), { ssr: false });

const METRICS = [
  { key: "treeCount",     label: "Tree Coverage",    icon: "🌳", unit: "%" },
  { key: "airQuality",    label: "Air Quality",       icon: "💨", unit: "%" },
  { key: "greenness",     label: "Green Space",       icon: "🌿", unit: "%" },
  { key: "waterClarity",  label: "Water Clarity",     icon: "💧", unit: "%" },
  { key: "biodiversity",  label: "Biodiversity",      icon: "🦋", unit: "%" },
  { key: "renewableEnergy", label: "Renewable Energy", icon: "⚡", unit: "%" },
] as const;

function MetricBar({ label, value, icon, unit }: { label: string; value: number; icon: string; unit: string }) {
  const color = value >= 65 ? "var(--green)" : value >= 35 ? "#86efac" : "#6b7280";
  return (
    <div style={{ padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1rem" }}>{icon}</span>
          <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)", fontWeight: 400 }}>{label}</span>
        </div>
        <span style={{ fontSize: "0.875rem", fontWeight: 700, color }}>{value}{unit}</span>
      </div>
      <div style={{ height: 3, background: "var(--surface-3)", borderRadius: 2, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: "100%", background: color, borderRadius: 2 }}
        />
      </div>
    </div>
  );
}

export default function CityPage() {
  const { cityState, activities } = useTerraStore();

  const metrics = [
    { key: "treeCount",       label: "Tree Coverage",     icon: "🌳", unit: "%", value: cityState.treeCount },
    { key: "airQuality",      label: "Air Quality",        icon: "💨", unit: "%", value: 100 - cityState.pollutionLevel },
    { key: "greenness",       label: "Green Space",        icon: "🌿", unit: "%", value: cityState.greenness },
    { key: "waterClarity",    label: "Water Clarity",      icon: "💧", unit: "%", value: cityState.waterClarity },
    { key: "biodiversity",    label: "Biodiversity",       icon: "🦋", unit: "%", value: cityState.biodiversity },
    { key: "renewableEnergy", label: "Renewable Energy",   icon: "⚡", unit: "%", value: cityState.renewableEnergy },
  ];

  const statusLabel =
    cityState.overallScore >= 75 ? "Thriving" :
    cityState.overallScore >= 50 ? "Growing"  :
    cityState.overallScore >= 25 ? "Struggling" : "Critical";

  const statusColor =
    cityState.overallScore >= 75 ? "var(--green)" :
    cityState.overallScore >= 50 ? "#86efac"      :
    cityState.overallScore >= 25 ? "#fbbf24"      : "#f87171";

  const totalCarbon = activities.reduce((s, a) => s + a.carbonEstimate, 0);

  return (
    <main style={{ minHeight: "100vh", background: "var(--black)" }}>
      <Navigation />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 24px 80px" }}>

        {/* ── PAGE HEADER ──────────────────────────────────── */}
        <div style={{ marginBottom: 36, paddingBottom: 28, borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green)", marginBottom: 8 }}>
            Feature 01
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "#fff" }}>
                3D City
              </h1>
              <p style={{ fontSize: "1rem", color: "var(--text-dim)", marginTop: 6, maxWidth: 440 }}>
                A real-time reflection of your environmental choices. Every activity reshapes this city.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: statusColor, lineHeight: 1 }}>{cityState.overallScore}</div>
                <div style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 4 }}>World Score</div>
              </div>
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: statusColor, lineHeight: 1 }}>{statusLabel}</div>
                <div style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 4 }}>Status</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ─────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

          {/* 3D City viewer */}
          <div>
            <div style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              overflow: "hidden",
              height: 520,
              position: "relative",
            }}>
              {/* Control label */}
              <div style={{
                position: "absolute", top: 16, left: 16, zIndex: 10,
                background: "var(--surface-2)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "6px 12px",
                fontSize: "0.75rem", color: "var(--text-dim)",
              }}>
                Drag to rotate · Auto-rotating
              </div>

              {/* City status dot */}
              <div style={{
                position: "absolute", top: 16, right: 16, zIndex: 10,
                background: "var(--surface-2)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "6px 14px",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor, display: "block" }} />
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: statusColor }}>{statusLabel}</span>
              </div>

              <City3D cityState={cityState} interactive={true} />
            </div>

            {/* Quick stats row below city */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
              {[
                { label: "Activities",     value: activities.length },
                { label: "Carbon Total",   value: `${Math.round(totalCarbon)}`, unit: "kg" },
                { label: "Pollution",      value: `${cityState.pollutionLevel}%` },
                { label: "Green Cover",    value: `${cityState.greenness}%` },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{s.value}{s.unit ? ` ${s.unit}` : ""}</div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar — metrics */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* City vitals card */}
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
                City Vitals
              </p>
              <div>
                {metrics.map((m) => (
                  <MetricBar key={m.key} label={m.label} value={m.value} icon={m.icon} unit={m.unit} />
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 14, padding: "20px" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff", marginBottom: 6 }}>
                Want to improve your city?
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 16 }}>
                Log sustainable activities to grow trees, clean your water, and bring life back to your city.
              </p>
              <Link href="/carbon" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Log an Activity →
              </Link>
            </div>

            {/* See future */}
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff", marginBottom: 6 }}>
                See both futures
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 16 }}>
                Compare the city you're building with the one you could build.
              </p>
              <Link href="/future" className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                Future Simulation →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
