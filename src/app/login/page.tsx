"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";
import { useTerraStore } from "@/store/useTerraStore";
import type { DietType, TransportType, EnergyType, UserProfile } from "@/store/useUserStore";

type Step = "phone" | "otp" | "setup";

/* ── colour from name hash ────────────────────────────────────── */
function avatarColor(name: string) {
  const palette = ["#22c55e", "#16a34a", "#15803d", "#166534", "#14532d"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}
function initials(name: string) {
  return name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "TB";
}

/* ── Step dots ────────────────────────────────────────────────── */
function Dots({ step }: { step: Step }) {
  const list: Step[] = ["phone", "otp", "setup"];
  const idx = list.indexOf(step);
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 36 }}>
      {list.map((_, i) => (
        <div key={i} style={{
          height: 3, borderRadius: 2,
          width: i === idx ? 28 : 8,
          background: i <= idx ? "var(--green)" : "var(--border-2)",
          transition: "all 0.3s ease",
        }} />
      ))}
    </div>
  );
}

/* ── Labelled input ───────────────────────────────────────────── */
function Field({ label, type = "text", value, onChange, placeholder, maxLength, autoFocus }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; maxLength?: number; autoFocus?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength} autoFocus={autoFocus}
        className="input" style={{ fontSize: "1rem" }}
      />
    </div>
  );
}

/* ── Option pill selector ─────────────────────────────────────── */
function PillSelect<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: { value: T; label: string; icon: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
        {label}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map((o) => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8, cursor: "pointer",
            fontSize: "0.8125rem", fontWeight: 500, border: "none",
            background: value === o.value ? "rgba(34,197,94,0.14)" : "var(--surface-3)",
            outline: value === o.value ? "1px solid rgba(34,197,94,0.45)" : "1px solid var(--border)",
            color: value === o.value ? "var(--green)" : "var(--text-dim)",
            transition: "all 0.15s ease",
          }}>
            {o.icon} {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Error banner ─────────────────────────────────────────────── */
function ErrMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div style={{
      background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
      borderRadius: 8, padding: "10px 14px",
      fontSize: "0.8125rem", color: "#f87171", marginBottom: 14,
    }}>{msg}</div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const router = useRouter();
  const { completeOtp, setProfile, isLoggedIn, profileComplete } = useUserStore();
  const { initForUser } = useTerraStore();

  useEffect(() => {
    if (isLoggedIn && profileComplete) router.replace("/");
    else if (isLoggedIn && !profileComplete) setStep("setup");
  }, [isLoggedIn, profileComplete, router]);

  const [step, setStep] = useState<Step>("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  /* phone */
  const [phone, setPhone]     = useState("");
  const [cc, setCc]           = useState("+91");
  const fullPhone             = `${cc}${phone.replace(/\D/g, "")}`;

  /* OTP */
  const [otp, setOtp]         = useState(["", "", "", "", "", ""]);
  const [timer, setTimer]     = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* setup form */
  const [form, setForm] = useState({
    name: "", email: "", age: "", city: "", country: "India",
    occupation: "", bio: "",
    diet: "omnivore"  as DietType,
    transport: "mixed" as TransportType,
    energy: "grid"    as EnergyType,
    weeklyGoal: 65, carbonBudget: 20,
  });

  /* countdown */
  useEffect(() => {
    if (step !== "otp") return;
    setTimer(30); setCanResend(false);
    const iv = setInterval(() => setTimer((t) => {
      if (t <= 1) { clearInterval(iv); setCanResend(true); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [step]);

  /* ── send OTP ──────────────────────────────────────────────── */
  const sendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) { setError("Enter a valid phone number"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setStep("otp");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  /* ── verify OTP ────────────────────────────────────────────── */
  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Enter all 6 digits"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      completeOtp(fullPhone);
      setStep("setup");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  /* ── OTP input handlers ────────────────────────────────────── */
  const onOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const onOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      const next = [...otp]; next[i - 1] = ""; setOtp(next);
      otpRefs.current[i - 1]?.focus();
    }
  };
  const onOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) { setOtp(text.split("")); setTimeout(() => otpRefs.current[5]?.focus(), 0); }
  };

  /* ── finish setup ──────────────────────────────────────────── */
  const finishSetup = () => {
    if (!form.name.trim()) { setError("Full name is required"); return; }
    if (!form.city.trim()) { setError("City is required"); return; }
    setError("");
    const profile: UserProfile = {
      ...form,
      name:      form.name.trim(),
      phone:     fullPhone,
      email:     form.email.trim(),
      city:      form.city.trim(),
      country:   form.country.trim(),
      occupation: form.occupation.trim(),
      bio:       form.bio.trim(),
      avatar:    avatarColor(form.name),
      joinedAt:  new Date().toISOString(),
    };
    setProfile(profile);
    initForUser(fullPhone);  // bind city/activity data to this user
    router.replace("/");
  };

  /* ── shell ─────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--black)", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 60px" }}>

      {/* top bar */}
      <div style={{ width: "100%", maxWidth: 480, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 0 0" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#000" }} />
          </div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Terra<span style={{ color: "var(--green)" }}>Bloom</span></span>
        </Link>
        {step !== "phone" && (
          <button type="button"
            onClick={() => { setError(""); setStep(step === "setup" ? "otp" : "phone"); }}
            style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "0.875rem" }}>
            ← Back
          </button>
        )}
      </div>

      {/* card */}
      <div style={{ width: "100%", maxWidth: 480, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px", marginTop: 28 }}>
        <Dots step={step} />

        <AnimatePresence mode="wait">

          {/* ══ STEP 1 — PHONE ══════════════════════════════════ */}
          {step === "phone" && (
            <motion.div key="phone" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.22 }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", marginBottom: 6 }}>Step 1 / 3</p>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 8 }}>Welcome to TerraBloom</h1>
              <p style={{ fontSize: "0.9rem", color: "var(--text-dim)", lineHeight: 1.65, marginBottom: 28 }}>
                Enter your phone number and we&apos;ll send a one-time verification code via SMS.
              </p>

              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>
                Phone Number
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <select value={cc} onChange={(e) => setCc(e.target.value)} className="input" style={{ width: 88, flexShrink: 0 }}>
                  {["+91","+1","+44","+61","+971","+65","+49","+33","+81","+86","+55","+27","+7"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210" maxLength={15} autoFocus
                  className="input" style={{ flex: 1, fontSize: "1rem" }}
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                />
              </div>

              <ErrMsg msg={error} />

              <button type="button" onClick={sendOtp} disabled={loading} className="btn-primary"
                style={{ width: "100%", padding: "14px", fontSize: "1rem", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Sending…" : "Send OTP →"}
              </button>

              <p style={{ textAlign: "center", fontSize: "0.73rem", color: "var(--text-muted)", marginTop: 18, lineHeight: 1.6 }}>
                Enter any phone number. Use code <strong style={{ color: "var(--green)" }}>123456</strong> to verify.
              </p>
            </motion.div>
          )}

          {/* ══ STEP 2 — OTP ════════════════════════════════════ */}
          {step === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.22 }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", marginBottom: 6 }}>Step 2 / 3</p>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 8 }}>Verify Your Number</h1>
              <p style={{ fontSize: "0.9rem", color: "var(--text-dim)", lineHeight: 1.65, marginBottom: 28 }}>
                Enter the verification code for <strong style={{ color: "#fff" }}>{fullPhone}</strong>. Use <strong style={{ color: "var(--green)" }}>123456</strong>.
              </p>

              {/* 6 boxes */}
              <div style={{ display: "flex", gap: 9, justifyContent: "center", marginBottom: 22 }} onPaste={onOtpPaste}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={(e) => onOtpChange(i, e.target.value)}
                    onKeyDown={(e) => onOtpKey(i, e)}
                    autoFocus={i === 0}
                    style={{
                      width: 50, height: 58, borderRadius: 10, textAlign: "center",
                      fontSize: "1.5rem", fontWeight: 700, color: "#fff",
                      background: "var(--surface-3)",
                      border: d ? "1.5px solid var(--green)" : "1.5px solid var(--border-2)",
                      outline: "none", transition: "border-color 0.15s",
                    }}
                  />
                ))}
              </div>

              <ErrMsg msg={error} />

              <button type="button" onClick={verifyOtp} disabled={loading} className="btn-primary"
                style={{ width: "100%", padding: "14px", fontSize: "1rem", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Verifying…" : "Verify & Continue →"}
              </button>

              {/* resend */}
              <div style={{ textAlign: "center", marginTop: 18 }}>
                {canResend ? (
                  <button type="button" onClick={() => { setOtp(["","","","","",""]); setError(""); sendOtp(); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8125rem", color: "var(--green)", fontWeight: 500 }}>
                    Resend OTP
                  </button>
                ) : (
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    Resend in <span style={{ color: "var(--green)", fontWeight: 600 }}>{timer}s</span>
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ══ STEP 3 — SETUP ══════════════════════════════════ */}
          {step === "setup" && (
            <motion.div key="setup" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.22 }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)", marginBottom: 6 }}>Step 3 / 3</p>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 8 }}>Set Up Your Profile</h1>
              <p style={{ fontSize: "0.9rem", color: "var(--text-dim)", lineHeight: 1.65, marginBottom: 24 }}>
                Tell us about yourself so TerraBloom can personalise your living city.
              </p>

              {/* Avatar preview */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: "50%",
                  background: form.name ? avatarColor(form.name) : "var(--surface-3)",
                  border: "2px solid var(--border-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.4rem", fontWeight: 700, color: form.name ? "#000" : "var(--text-muted)",
                  transition: "background 0.3s",
                }}>
                  {form.name ? initials(form.name) : "?"}
                </div>
              </div>

              {/* scrollable form body */}
              <div style={{ maxHeight: "52vh", overflowY: "auto", paddingRight: 2 }}>

                {/* ─ Basic info ─ */}
                <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>Basic Info</p>

                <Field label="Full Name *"  value={form.name}       onChange={(v) => setForm({ ...form, name: v })}       placeholder="Aisha Khan" autoFocus />
                <Field label="Email"        value={form.email}      onChange={(v) => setForm({ ...form, email: v })}      type="email" placeholder="aisha@example.com" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Age"        value={form.age}        onChange={(v) => setForm({ ...form, age: v })}        type="number" placeholder="24" />
                  <Field label="Occupation" value={form.occupation} onChange={(v) => setForm({ ...form, occupation: v })} placeholder="Student" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="City *"    value={form.city}        onChange={(v) => setForm({ ...form, city: v })}       placeholder="Mumbai" />
                  <Field label="Country"   value={form.country}     onChange={(v) => setForm({ ...form, country: v })}   placeholder="India" />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 7 }}>Short Bio</label>
                  <textarea className="input" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="I care about the planet…" />
                </div>

                {/* ─ Lifestyle ─ */}
                <div style={{ height: 1, background: "var(--border)", margin: "18px 0" }} />
                <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 14 }}>Lifestyle</p>

                <PillSelect label="Diet" value={form.diet} onChange={(v) => setForm({ ...form, diet: v })}
                  options={[
                    { value: "omnivore",    label: "Omnivore",    icon: "🍖" },
                    { value: "vegetarian",  label: "Vegetarian",  icon: "🥗" },
                    { value: "vegan",       label: "Vegan",       icon: "🌱" },
                    { value: "pescatarian", label: "Pescatarian", icon: "🐟" },
                  ]}
                />
                <PillSelect label="Main Transport" value={form.transport} onChange={(v) => setForm({ ...form, transport: v })}
                  options={[
                    { value: "car",    label: "Car",     icon: "🚗" },
                    { value: "public", label: "Transit", icon: "🚇" },
                    { value: "cycle",  label: "Cycle",   icon: "🚲" },
                    { value: "walk",   label: "Walk",    icon: "🚶" },
                    { value: "mixed",  label: "Mixed",   icon: "🔀" },
                  ]}
                />
                <PillSelect label="Home Energy" value={form.energy} onChange={(v) => setForm({ ...form, energy: v })}
                  options={[
                    { value: "grid",      label: "Grid",      icon: "⚡" },
                    { value: "renewable", label: "Renewable", icon: "☀️" },
                    { value: "mixed",     label: "Mixed",     icon: "🔀" },
                  ]}
                />

                {/* ─ Goals ─ */}
                <div style={{ height: 1, background: "var(--border)", margin: "18px 0" }} />
                <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 14 }}>Goals</p>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <label style={{ fontSize: "0.8125rem", color: "var(--text-dim)" }}>Weekly Sustainability Target</label>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--green)" }}>{form.weeklyGoal}/100</span>
                  </div>
                  <input type="range" min={20} max={100} step={5} value={form.weeklyGoal}
                    onChange={(e) => setForm({ ...form, weeklyGoal: +e.target.value })}
                    style={{ width: "100%", accentColor: "var(--green)" }} />
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <label style={{ fontSize: "0.8125rem", color: "var(--text-dim)" }}>Weekly Carbon Budget</label>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--green)" }}>{form.carbonBudget} kg CO₂e</span>
                  </div>
                  <input type="range" min={5} max={100} step={5} value={form.carbonBudget}
                    onChange={(e) => setForm({ ...form, carbonBudget: +e.target.value })}
                    style={{ width: "100%", accentColor: "var(--green)" }} />
                </div>
              </div>

              <ErrMsg msg={error} />

              <button type="button" onClick={finishSetup} className="btn-primary"
                style={{ width: "100%", padding: "14px", fontSize: "1rem", marginTop: 18 }}>
                Enter My World →
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
