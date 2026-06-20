"use client";

/**
 * HOME PAGE — Scroll-driven video experience
 *
 * Layout (each section = 100vh, content sticky-centered):
 *  Section 0 — Hero           (100vh)
 *  Section 1 — Feature: 3D City      (100vh)
 *  Section 2 — Feature: Carbon Log   (100vh)
 *  Section 3 — Feature: History      (100vh)
 *  Section 4 — Feature: Future Sim   (100vh)
 *  Section 5 — Stats + How it works  (100vh)
 *  Section 6 — Final CTA             (100vh)
 *
 * Total: 7 × 100vh = 700vh of scroll → video plays fully.
 *
 * Each section has `position: sticky; top: 0` so content locks to
 * viewport while the outer div provides scroll height.
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import VideoBackground from "@/components/VideoBackground";
import Navigation from "@/components/Navigation";
import { useTerraStore } from "@/store/useTerraStore";

/* ── Feature data ──────────────────────────────────────────────── */
const FEATURES = [
  {
    number: "01",
    href: "/city",
    label: "3D City",
    title: "Your Living World",
    desc: "A real-time 3D city that grows or decays based on every choice you make. Watch your skyline change as your habits evolve over time.",
    detail: "Buildings gain rooftop gardens. Lakes clear up. Trees multiply. Or smog thickens and greenery disappears. The city is you.",
    cta: "Open 3D City",
    icon: "⬡",
  },
  {
    number: "02",
    href: "/carbon",
    label: "Carbon Log",
    title: "AI Impact Analysis",
    desc: "Upload a photo of any activity — a meal, a commute, a purchase, a bill. Gemini AI measures the exact carbon footprint in seconds.",
    detail: "Point your camera at a burger, a flight ticket, a plastic bottle, or a cycling route. Get an instant impact score and actionable advice.",
    cta: "Log an Activity",
    icon: "◎",
  },
  {
    number: "03",
    href: "/history",
    label: "History",
    title: "Day-by-Day Record",
    desc: "Every activity you log lives in a visual calendar. Select any day to see your impact score, what you did, and how your city looked.",
    detail: "Green dots mark good days. Grey marks bad ones. Your entire environmental journey, one tap at a time.",
    cta: "View History",
    icon: "▦",
  },
  {
    number: "04",
    href: "/future",
    label: "Future Simulation",
    title: "Two Possible Worlds",
    desc: "See the city you are building right now — and the city you could build with small sustainable changes. Side by side.",
    detail: "One path continues your current habits. The other shows what happens with five simple switches. The difference will surprise you.",
    cta: "See Your Future",
    icon: "◈",
  },
];

/* ── Intersection-based fade-in ────────────────────────────────── */
function useFadeIn() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ── Sticky full-screen section wrapper ────────────────────────── */
function FullSection({
  children,
  bg = "transparent",
  borderTop = false,
}: {
  children: React.ReactNode;
  bg?: string;
  borderTop?: boolean;
}) {
  return (
    /* outer div gives the scroll height */
    <div style={{ height: "100vh", position: "relative" }}>
      {/* inner sticky panel locks content to viewport */}
      <div style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        borderTop: borderTop ? "1px solid var(--border)" : "none",
        zIndex: 10,
        overflow: "hidden",
      }}>
        {children}
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */
export default function HomePage() {
  useFadeIn();
  const { cityState, activities } = useTerraStore();
  const totalCarbon = Math.round(activities.reduce((s, a) => s + a.carbonEstimate, 0) * 10) / 10;

  return (
    <main style={{ position: "relative", background: "transparent" }}>
      {/* Fixed video — fills 100vh behind all sticky sections */}
      <VideoBackground />

      {/* Green scroll-progress line at very top */}
      <div id="scroll-bar" style={{
        position: "fixed", top: 0, left: 0, height: 2,
        background: "var(--green)", zIndex: 9999,
        width: "0%", transition: "none",
      }} />

      <Navigation />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 0 — HERO  (100vh)
      ═══════════════════════════════════════════════════════════ */}
      <FullSection>
        <div style={{ textAlign: "center", padding: "0 24px", maxWidth: 860, width: "100%" }}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <p style={{
              fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "var(--green)", marginBottom: 28,
            }}>
              AI Sustainability Platform
            </p>

            <h1 style={{
              fontSize: "clamp(4.5rem, 12vw, 10rem)",
              fontWeight: 700, letterSpacing: "-0.045em",
              lineHeight: 0.92, color: "#fff", marginBottom: 28,
            }}>
              Terra<span style={{ color: "var(--green)" }}>Bloom</span>
            </h1>

            <p style={{
              fontSize: "clamp(1rem, 2.2vw, 1.4rem)",
              color: "#ffffff", fontWeight: 700,
              lineHeight: 1.6, maxWidth: 520, margin: "0 auto 44px",
            }}>
              Your choices shape the world you live in.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/carbon" className="btn-primary">
                Log Activity →
              </Link>
              <Link href="/city" className="btn-secondary">
                View My City
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll cue — centered absolutely within the sticky section */}
        <motion.div
          animate={{ y: [0, 9, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", bottom: 40,
            left: 0, right: 0,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 500 }}>
            Scroll to explore
          </span>
          <motion.div
            animate={{ scaleY: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 1, height: 32, background: "var(--green)", borderRadius: 1 }}
          />
        </motion.div>
      </FullSection>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — FEATURE: 3D City  (100vh)
      ═══════════════════════════════════════════════════════════ */}
      <FullSection borderTop>
        <FeatureSection feature={FEATURES[0]} align="left" />
      </FullSection>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — FEATURE: Carbon Log  (100vh)
      ═══════════════════════════════════════════════════════════ */}
      <FullSection borderTop>
        <FeatureSection feature={FEATURES[1]} align="right" />
      </FullSection>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — FEATURE: History  (100vh)
      ═══════════════════════════════════════════════════════════ */}
      <FullSection borderTop>
        <FeatureSection feature={FEATURES[2]} align="left" />
      </FullSection>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — FEATURE: Future Simulation  (100vh)
      ═══════════════════════════════════════════════════════════ */}
      <FullSection borderTop>
        <FeatureSection feature={FEATURES[3]} align="right" />
      </FullSection>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — LIVE STATS  (100vh)
      ═══════════════════════════════════════════════════════════ */}
      <FullSection bg="rgba(0,0,0,0.72)" borderTop>
        <div style={{ width: "100%", maxWidth: 1100, padding: "0 24px" }}>
          <div className="reveal" style={{
            opacity: 0, transform: "translateY(24px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
            textAlign: "center", marginBottom: 60,
          }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", marginBottom: 12 }}>
              Your world right now
            </p>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "#fff" }}>
              Live Snapshot
            </h2>
          </div>

          {/* Stats grid */}
          <div className="reveal" style={{
            opacity: 0, transform: "translateY(24px)",
            transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            border: "1px solid var(--border)",
            borderRadius: 16, overflow: "hidden",
            background: "var(--surface-2)",
          }}>
            {[
              { label: "World Score",  value: cityState.overallScore, suffix: "/100", color: "var(--green)" },
              { label: "Activities",   value: activities.length,       suffix: " logged" },
              { label: "Carbon",       value: totalCarbon,             suffix: " kg CO₂" },
              { label: "Tree Cover",   value: `${cityState.treeCount}`, suffix: "%" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "36px 24px", textAlign: "center",
                borderRight: i < 3 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700,
                  color: s.color || "#fff", letterSpacing: "-0.03em", lineHeight: 1,
                }}>
                  {s.value}<span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 400 }}>{s.suffix}</span>
                </div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 8 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* How it works — 3 steps below */}
          <div className="reveal" style={{
            opacity: 0, transform: "translateY(24px)",
            transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 20,
          }}>
            {[
              { n: "01", t: "Upload a photo",      d: "Any activity — food, travel, energy, shopping." },
              { n: "02", t: "AI reads the impact", d: "Gemini estimates carbon and gives a score." },
              { n: "03", t: "City responds",       d: "Good choices grow trees. Bad ones add smog." },
            ].map((s, i) => (
              <div key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px 24px" }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "rgba(34,197,94,0.1)", lineHeight: 1, marginBottom: 12, letterSpacing: "-0.04em" }}>{s.n}</div>
                <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#fff", marginBottom: 6 }}>{s.t}</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-dim)", lineHeight: 1.6 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </FullSection>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6 — FINAL CTA  (100vh)
      ═══════════════════════════════════════════════════════════ */}
      <FullSection bg="rgba(0,0,0,0.80)" borderTop>
        <div style={{ textAlign: "center", padding: "0 24px", maxWidth: 600 }}>
          <div className="reveal" style={{
            opacity: 0, transform: "translateY(24px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}>
            <h2 style={{
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 700, letterSpacing: "-0.035em",
              color: "#fff", lineHeight: 1.0, marginBottom: 20,
            }}>
              Your future<br />starts{" "}
              <span style={{ color: "var(--green)" }}>today.</span>
            </h2>
            <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 40 }}>
              Every small choice compounds into the world you will live in.
              Begin shaping it now.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/carbon" className="btn-primary" style={{ padding: "16px 40px", fontSize: "1rem" }}>
                Start Logging →
              </Link>
              <Link href="/future" className="btn-secondary" style={{ padding: "16px 32px", fontSize: "1rem" }}>
                See Future Simulation
              </Link>
            </div>
          </div>

          {/* Footer line */}
          <div style={{
            position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 20,
            color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap",
          }}>
            <span>Terra<span style={{ color: "var(--green)" }}>Bloom</span></span>
            <span style={{ width: 1, height: 14, background: "var(--border)", display: "block" }} />
            <span>A living sustainability platform</span>
            <span style={{ width: 1, height: 14, background: "var(--border)", display: "block" }} />
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "block" }} />
              World is alive
            </span>
          </div>
        </div>
      </FullSection>
    </main>
  );
}

/* ── Feature full-screen section ───────────────────────────────── */
function FeatureSection({
  feature,
  align,
}: {
  feature: typeof FEATURES[number];
  align: "left" | "right";
}) {
  const isLeft = align === "left";

  return (
    <div style={{
      width: "100%", maxWidth: 1100, padding: "0 24px",
      display: "grid",
      gridTemplateColumns: isLeft ? "1fr 1fr" : "1fr 1fr",
      gap: 80,
      alignItems: "center",
    }}>

      {/* Text block */}
      <div
        className="reveal"
        style={{
          order: isLeft ? 0 : 1,
          opacity: 0, transform: "translateY(28px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        {/* Feature number */}
        <p style={{
          fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 20,
        }}>
          {feature.number} / 04
        </p>

        {/* Label */}
        <p style={{
          fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--green)", marginBottom: 16,
        }}>
          {feature.label}
        </p>

        {/* Title */}
        <h2 style={{
          fontSize: "clamp(2rem, 4vw, 3.25rem)",
          fontWeight: 700, letterSpacing: "-0.025em",
          color: "#fff", lineHeight: 1.05, marginBottom: 20,
        }}>
          {feature.title}
        </h2>

        {/* Desc */}
        <p style={{
          fontSize: "1.05rem", color: "rgba(255,255,255,0.55)",
          lineHeight: 1.7, marginBottom: 16,
        }}>
          {feature.desc}
        </p>

        {/* Detail */}
        <p style={{
          fontSize: "0.9rem", color: "rgba(255,255,255,0.35)",
          lineHeight: 1.7, marginBottom: 36,
          paddingLeft: 16,
          borderLeft: "2px solid rgba(34,197,94,0.3)",
        }}>
          {feature.detail}
        </p>

        <Link href={feature.href} className="btn-primary">
          {feature.cta} →
        </Link>
      </div>

      {/* Visual block */}
      <div
        className="reveal"
        style={{
          order: isLeft ? 1 : 0,
          opacity: 0, transform: "translateY(28px)",
          transition: "opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s",
        }}
      >
        <div style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "36px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          aspectRatio: "4/3",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Feature number — top left, clear of arrow */}
          <div style={{
            position: "absolute",
            top: 20, left: 24,
            fontSize: "0.7rem", fontWeight: 700,
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--text-muted)",
          }}>
            {feature.number} / 04
          </div>

          {/* Feature icon — centered */}
          <div style={{
            fontSize: "3.5rem",
            color: "var(--green)",
            marginBottom: 20,
            lineHeight: 1,
          }}>
            {feature.icon}
          </div>

          {/* Feature name */}
          <p style={{
            fontSize: "1.25rem", fontWeight: 700,
            color: "#fff", marginBottom: 8, letterSpacing: "-0.01em",
            textAlign: "center",
          }}>
            {feature.title}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textAlign: "center" }}>
            {feature.label}
          </p>

          {/* Arrow — bottom right only */}
          <div style={{
            position: "absolute", bottom: 20, right: 20,
            width: 36, height: 36, borderRadius: 8,
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--green)", fontSize: "0.9rem",
          }}>
            →
          </div>
        </div>
      </div>
    </div>
  );
}
