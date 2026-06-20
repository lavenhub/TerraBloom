"use client";

import Link from "next/link";
import Navigation from "@/components/Navigation";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--black)" }}>
      <Navigation />
      <div style={{
        maxWidth: 480, margin: "0 auto",
        padding: "140px 24px 80px",
        textAlign: "center",
      }}>
        <p style={{
          fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--green)", marginBottom: 16,
        }}>404</p>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#fff", marginBottom: 12 }}>
          This page doesn&apos;t exist yet.
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--text-dim)", lineHeight: 1.65, marginBottom: 36 }}>
          The city has no record of this path. Perhaps it hasn&apos;t been built, or the fog swallowed it.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/" className="btn-primary">Return Home</Link>
          <Link href="/carbon" className="btn-secondary">Log Activity</Link>
        </div>
      </div>
    </main>
  );
}
