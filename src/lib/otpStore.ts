/**
 * otpStore.ts — server-side singleton
 *
 * Single source of truth for OTP state. Imported by both the send and
 * verify API routes. Because this module is loaded once per Node.js
 * process, the Map is shared across routes without cross-importing
 * route files (which breaks in some bundler configs).
 *
 * In production with multiple server instances use Redis instead.
 * Replace the Map operations with redis.set/get/del calls and this
 * module's interface stays identical.
 */

export interface OtpRecord {
  code:     string;
  expires:  number;   // epoch ms — 10-minute TTL
  attempts: number;   // wrong guesses so far
  locked:   boolean;  // true after 5 bad attempts
}

export interface RateRecord {
  count:     number;  // send requests in window
  windowEnd: number;  // epoch ms when the window resets
}

// ── OTP records keyed by normalised phone ─────────────────────────
const otpMap  = new Map<string, OtpRecord>();

// ── Rate-limit records keyed by normalised phone ──────────────────
const rateMap = new Map<string, RateRecord>();

// ── Config ────────────────────────────────────────────────────────
const OTP_TTL_MS     = 10 * 60 * 1000;   // 10 minutes
const MAX_SENDS      = 3;                 // max OTPs per window
const RATE_WINDOW_MS = 10 * 60 * 1000;   // rolling 10-minute window
const MAX_ATTEMPTS   = 5;                 // wrong guesses before lockout

// ── Helpers ───────────────────────────────────────────────────────
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function normalise(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, "");
}

// ── Rate limiting ─────────────────────────────────────────────────
/** Returns true if the phone is allowed to receive another OTP. */
export function checkRateLimit(phone: string): { allowed: boolean; retryAfterSec: number } {
  const now  = Date.now();
  const norm = normalise(phone);
  const rec  = rateMap.get(norm);

  if (!rec || now >= rec.windowEnd) {
    // First request or window expired — reset
    rateMap.set(norm, { count: 1, windowEnd: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (rec.count >= MAX_SENDS) {
    const retryAfterSec = Math.ceil((rec.windowEnd - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  rec.count++;
  return { allowed: true, retryAfterSec: 0 };
}

// ── Store OTP ─────────────────────────────────────────────────────
export function storeOtp(phone: string, code: string): void {
  otpMap.set(normalise(phone), {
    code,
    expires:  Date.now() + OTP_TTL_MS,
    attempts: 0,
    locked:   false,
  });
}

// ── Verify OTP ────────────────────────────────────────────────────
export type VerifyResult =
  | { ok: true }
  | { ok: false; error: string; locked?: boolean };

export function verifyOtp(phone: string, code: string): VerifyResult {
  const norm = normalise(phone);
  const rec  = otpMap.get(norm);

  if (!rec) {
    return { ok: false, error: "No OTP found for this number. Please request a new one." };
  }

  if (rec.locked) {
    return { ok: false, error: "Too many incorrect attempts. Please request a new OTP.", locked: true };
  }

  if (Date.now() > rec.expires) {
    otpMap.delete(norm);
    return { ok: false, error: "OTP has expired. Please request a new one." };
  }

  if (rec.code !== code.trim()) {
    rec.attempts++;
    if (rec.attempts >= MAX_ATTEMPTS) {
      rec.locked = true;
      return { ok: false, error: "Too many incorrect attempts. Please request a new OTP.", locked: true };
    }
    const remaining = MAX_ATTEMPTS - rec.attempts;
    return { ok: false, error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` };
  }

  // ✓ Correct — clean up
  otpMap.delete(norm);
  return { ok: true };
}

// ── Cleanup expired records (call periodically if needed) ─────────
export function pruneExpired(): void {
  const now = Date.now();
  for (const [k, v] of otpMap)  if (now > v.expires)      otpMap.delete(k);
  for (const [k, v] of rateMap) if (now >= v.windowEnd)   rateMap.delete(k);
}
