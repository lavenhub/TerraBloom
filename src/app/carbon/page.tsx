"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import { useTerraStore } from "@/store/useTerraStore";
import { useUserStore } from "@/store/useUserStore";
import type { Activity, ImpactLevel } from "@/store/useTerraStore";
import { analyzeActivity } from "@/lib/gemini";

type Step = "idle" | "uploading" | "analyzing" | "result";

const EXAMPLE_NOTES = [
  "Ordered a burger and coke for lunch",
  "Took the metro to college",
  "Bought groceries at the supermarket",
  "Left my PC on overnight",
  "Cycled to work this morning",
  "Bought a plastic water bottle",
  "Booked a flight to Delhi",
];

export default function CarbonPage() {
  const [step, setStep]                 = useState<Step>("idle");
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [note, setNote]                 = useState("");
  const [dragOver, setDragOver]         = useState(false);
  const [result, setResult]             = useState<Partial<Activity> | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [exampleIdx, setExampleIdx]     = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router       = useRouter();
  const { addActivity, initForUser } = useTerraStore();
  const { profile, isLoggedIn }      = useUserStore();

  // Ensure TerraStore is initialised for the current user
  useEffect(() => {
    if (isLoggedIn && profile?.phone) {
      initForUser(profile.phone);
    }
  }, [isLoggedIn, profile?.phone, initForUser]);

  /* ── file handling ─────────────────────────────────────────── */
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WebP, GIF).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      return;
    }
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageDataUrl(e.target?.result as string);
      setStep("uploading");
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  /* ── analyze ───────────────────────────────────────────────── */
  const handleAnalyze = async () => {
    if (!imageFile || !imageDataUrl) return;
    setStep("analyzing");
    setError(null);
    try {
      const analysis = await analyzeActivity(imageDataUrl, note);
      setResult(analysis);
      setStep("result");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed.";
      setError(msg);
      setStep("uploading");
    }
  };

  /* ── save ──────────────────────────────────────────────────── */
  const handleSave = () => {
    if (!result) return;
    const activity: Activity = {
      id:                  crypto.randomUUID(),
      timestamp:           new Date().toISOString(),
      imageDataUrl,
      note,
      category:            result.category            || "General",
      impact:              (result.impact as ImpactLevel) || "neutral",
      carbonEstimate:      result.carbonEstimate       || 0,
      sustainabilityScore: result.sustainabilityScore  || 50,
      recommendation:      result.recommendation       || "",
      environmentalImpact: result.environmentalImpact  || "",
    };
    addActivity(activity);
    router.push("/history");
  };

  const reset = () => {
    setStep("idle");
    setImageFile(null);
    setImageDataUrl(null);
    setNote("");
    setResult(null);
    setError(null);
  };

  /* ── colours ───────────────────────────────────────────────── */
  const scoreColor  = (s: number) => s >= 70 ? "var(--green)" : s >= 40 ? "#86efac" : "#6b7280";
  const impactColor = (i: string) =>
    i === "positive" ? "var(--green)" : i === "negative" ? "#f87171" : "var(--text-dim)";

  /* ── render ────────────────────────────────────────────────── */
  return (
    <main style={{ minHeight: "100vh", background: "var(--black)" }}>
      <Navigation />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px 80px" }}>

        {/* PAGE HEADER */}
        <div style={{ marginBottom: 40, paddingBottom: 28, borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", marginBottom: 6 }}>
            Feature 02
          </p>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "#fff", marginBottom: 6 }}>
            Carbon Log
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-dim)", maxWidth: 480 }}>
            Upload any photo — food, transport, shopping, energy. AI estimates the environmental impact and updates your city.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

          {/* ── LEFT: upload + result ── */}
          <div>
            <AnimatePresence mode="wait">

              {/* IDLE / UPLOADING */}
              {(step === "idle" || step === "uploading") && (
                <motion.div key="upload"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Drop zone — keyboard accessible */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={imageDataUrl ? "Image uploaded. Click to replace." : "Upload activity image. Click or drag and drop."}
                    onDrop={onDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => !imageDataUrl && fileInputRef.current?.click()}
                    onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !imageDataUrl) { e.preventDefault(); fileInputRef.current?.click(); } }}
                    style={{
                      border: dragOver ? "2px solid var(--green)" : "2px dashed var(--border-2)",
                      borderRadius: 14,
                      overflow: "hidden",
                      height: imageDataUrl ? 260 : 200,
                      position: "relative",
                      cursor: imageDataUrl ? "default" : "pointer",
                      background: dragOver ? "rgba(34,197,94,0.04)" : "var(--surface-2)",
                      transition: "all 0.2s ease",
                      marginBottom: 14,
                    }}
                  >
                    {imageDataUrl ? (
                      <>
                        <Image src={imageDataUrl} alt="Activity" fill style={{ objectFit: "cover", opacity: 0.88 }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
                        {/* Remove button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); reset(); }}
                          style={{
                            position: "absolute", top: 10, right: 10,
                            width: 30, height: 30, borderRadius: 6,
                            background: "rgba(0,0,0,0.75)", border: "1px solid var(--border-2)",
                            color: "#fff", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700,
                          }}
                        >✕</button>
                        <div style={{
                          position: "absolute", bottom: 10, left: 12,
                          background: "var(--surface-2)", border: "1px solid var(--border)",
                          borderRadius: 5, padding: "3px 10px",
                          fontSize: "0.72rem", color: "var(--green)", fontWeight: 600,
                        }}>
                          ✓ Image ready
                        </div>
                      </>
                    ) : (
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-muted)" }}>
                        <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                          <rect x="4" y="10" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                          <circle cx="14" cy="19" r="3" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M4 28 L12 20 L20 27 L27 20 L36 28" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                          <line x1="20" y1="2" x2="20" y2="10" stroke="currentColor" strokeWidth="1.5"/>
                          <line x1="16" y1="6" x2="20" y2="2" stroke="currentColor" strokeWidth="1.5"/>
                          <line x1="24" y1="6" x2="20" y2="2" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>Drop image here</p>
                          <p style={{ fontSize: "0.8rem", marginTop: 3 }}>or click to browse</p>
                        </div>
                        <p style={{ fontSize: "0.72rem" }}>JPG · PNG · WebP · max 10 MB</p>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef} type="file" accept="image/*"
                    aria-label="Upload an image of your activity"
                    style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />

                  {/* Note field */}
                  <div style={{ marginBottom: 14 }}>
                    <label htmlFor="activity-note" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>
                      What did you do? <span style={{ color: "var(--border-2)", fontWeight: 400 }}>(optional but improves accuracy)</span>
                    </label>
                    <textarea
                      id="activity-note"
                      className="input"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={`e.g. "${EXAMPLE_NOTES[exampleIdx]}"`}
                      rows={3}
                      onFocus={() => setExampleIdx((i) => (i + 1) % EXAMPLE_NOTES.length)}
                    />
                  </div>

                  {error && (
                    <div style={{
                      background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)",
                      borderRadius: 8, padding: "10px 14px",
                      fontSize: "0.8125rem", color: "#f87171", marginBottom: 14,
                    }}>
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleAnalyze}
                    disabled={!imageFile}
                    aria-disabled={!imageFile}
                    className="btn-primary"
                    style={{ width: "100%", padding: "14px", fontSize: "0.9375rem", opacity: imageFile ? 1 : 0.35, cursor: imageFile ? "pointer" : "not-allowed" }}
                  >
                    Analyze with AI →
                  </button>

                  {!imageFile && (
                    <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 10 }}>
                      Upload an image to enable analysis
                    </p>
                  )}
                </motion.div>
              )}

              {/* ANALYZING */}
              {step === "analyzing" && (
                <motion.div key="analyzing"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{
                    background: "var(--surface-2)", border: "1px solid var(--border)",
                    borderRadius: 16, padding: "56px 40px", textAlign: "center",
                  }}>
                    <div style={{ position: "relative", width: 60, height: 60, margin: "0 auto 20px" }}>
                      {[0, 1].map((i) => (
                        <motion.div key={i}
                          style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid var(--green)" }}
                          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                          transition={{ duration: 1.4, delay: i * 0.5, repeat: Infinity, ease: "easeOut" }}
                        />
                      ))}
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--green)" }} />
                      </div>
                    </div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: 6 }}>Analyzing impact…</h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-dim)" }}>AI is reading your activity</p>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 20 }}>
                      {[0, 0.18, 0.36].map((d, i) => (
                        <motion.div key={i}
                          style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)" }}
                          animate={{ y: [-4, 0, -4] }}
                          transition={{ duration: 0.65, delay: d, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* RESULT */}
              {step === "result" && result && (
                <motion.div key="result"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  {/* Image strip */}
                  {imageDataUrl && (
                    <div style={{ position: "relative", height: 180, borderRadius: "14px 14px 0 0", overflow: "hidden" }}>
                      <Image src={imageDataUrl} alt="Activity" fill style={{ objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--surface-2) 0%, transparent 55%)" }} />
                    </div>
                  )}

                  <div style={{
                    background: "var(--surface-2)", border: "1px solid var(--border)",
                    borderRadius: imageDataUrl ? "0 0 14px 14px" : 14,
                    padding: "24px",
                  }}>
                    {/* Category + impact row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: "var(--green)", background: "rgba(34,197,94,0.1)",
                        border: "1px solid rgba(34,197,94,0.2)", padding: "3px 10px", borderRadius: 4,
                      }}>
                        {result.category}
                      </span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: impactColor(result.impact || "neutral"), textTransform: "capitalize" }}>
                        {result.impact} impact
                      </span>
                    </div>

                    {/* Score + carbon */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                      <div style={{ background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                          {result.carbonEstimate}
                        </div>
                        <div style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 4 }}>
                          kg CO₂e
                        </div>
                      </div>
                      <div style={{ background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: "1.875rem", fontWeight: 800, color: scoreColor(result.sustainabilityScore || 50), lineHeight: 1 }}>
                          {result.sustainabilityScore}
                        </div>
                        <div style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 4 }}>
                          Score / 100
                        </div>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div style={{ height: 4, background: "var(--surface-3)", borderRadius: 2, overflow: "hidden", marginBottom: 18 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.sustainabilityScore}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        style={{ height: "100%", background: scoreColor(result.sustainabilityScore || 50), borderRadius: 2 }}
                      />
                    </div>

                    {/* Impact detail */}
                    {result.environmentalImpact && (
                      <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 5 }}>Impact Detail</p>
                        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.65 }}>
                          {result.environmentalImpact}
                        </p>
                      </div>
                    )}

                    {/* Recommendation */}
                    {result.recommendation && (
                      <div style={{
                        background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)",
                        borderRadius: 10, padding: "12px 14px", marginBottom: 18,
                      }}>
                        <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--green)", marginBottom: 5 }}>
                          AI Recommendation
                        </p>
                        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.65 }}>
                          {result.recommendation}
                        </p>
                      </div>
                    )}

                    {/* City impact notice */}
                    <div style={{
                      background: "var(--surface-3)", border: "1px solid var(--border)",
                      borderRadius: 8, padding: "10px 14px", marginBottom: 18,
                      fontSize: "0.8rem", color: "var(--text-dim)",
                    }}>
                      {(result.sustainabilityScore || 0) >= 60
                        ? "🌳 Your city will gain trees and cleaner air after saving this."
                        : (result.sustainabilityScore || 0) >= 40
                        ? "🌿 Your city holds steady. Every small improvement counts."
                        : "🏭 Your city will become more polluted. Consider alternatives."}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={reset} className="btn-secondary" style={{ flex: 1 }}>
                        Log Another
                      </button>
                      <button onClick={handleSave} className="btn-primary" style={{ flex: 2 }}>
                        Save to My World →
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ── RIGHT: sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* What to upload */}
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px" }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 14 }}>
                What to upload
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "🍔", label: "Food & Drink",  eg: "Burger, coffee, restaurant meal" },
                  { icon: "🚇", label: "Transport",      eg: "Metro ticket, flight, car trip" },
                  { icon: "🛍", label: "Shopping",       eg: "Receipt, clothes, electronics" },
                  { icon: "⚡", label: "Energy",         eg: "Electricity bill, gas invoice" },
                  { icon: "♻️", label: "Waste",          eg: "Plastic bottle, packaging" },
                  { icon: "🚲", label: "Green choice",   eg: "Cycling, walking, vegan meal" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "#fff" }}>{item.label}</p>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 1 }}>{item.eg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>




            {/* How scoring works */}
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px" }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
                How scoring works
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { range: "70 – 100", label: "Positive", color: "var(--green)", desc: "City gains trees + clean air" },
                  { range: "40 – 69",  label: "Neutral",  color: "#86efac",      desc: "City stays stable" },
                  { range: "0 – 39",   label: "Negative", color: "#6b7280",      desc: "Pollution rises, trees fall" },
                ].map((s) => (
                  <div key={s.range} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 3, height: 28, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: "0.78rem", fontWeight: 600, color: s.color }}>{s.range} — {s.label}</p>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
