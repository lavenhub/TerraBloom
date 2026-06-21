/**
 * otpStore.ts — server-side singleton OTP store
 *
 * Uses a single in-memory Map (fine for single-instance / demo).
 * For multi-instance production deployments replace Map ops with Redis.
 *
 * Security:
 * - OTP codes generated with crypto.randomInt (CSPRNG, not Math.random)
 * - Attempt lockout after MAX_ATTEMPTS wrong guesses
 * - Rate limiting: MAX_SENDS per phone per RATE_WINDOW_MS
 * - Automatic expiry pruning to prevent unbounded memory growth
 */

import { randomInt } from "crypto";

// ── Types ──────────────────────────────────────────────────────────
export interface OtpRecord {
  code:     string;
  expires:  number;   // epoch ms
  attempts: number;   // wrong guesses so far
  locked:   boolean;  // true after MAX_ATTEMPTS failures
}

export interface RateRecord {
  count:     number;  // send requests in current window
  windowEnd: number;  // epoch ms when the window resets
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; error: string; locked?: boolean };

// ── Config constants ───────────────────────────────────────────────
const OTP_TTL_MS     = 10 * 60 * 1_000;  // 10 minutes
const RATE_WINDOW_MS = 10 * 60 * 1_000;  // 10-minute rolling window
const MAX_SENDS      = 3;                 // max OTP requests per window
const MAX_ATTEMPTS   = 5;                 // wrong guesses before lockout
const OTP_MIN        = 100_000;           // smallest 6-digit number
const OTP_MAX        = 999_999;           // largest  6-digit number
const PRUNE_INTERVAL = 15 * 60 * 1_000;  // prune every 15 minutes

// ── Internal stores ────────────────────────────────────────────────
const otpMap  = new Map<string, OtpRecord>();
const rateMap = new Map<string, RateRecord>();

// ── Auto-prune expired records every 15 minutes ───────────────────
// Prevents unbounded memory growth in long-running server processes.
if (typeof setInterval !== "undefined") {
  setInterval(pruneExpired, PRUNE_INTERVAL).unref?.();
}

// ── Public helpers ─────────────────────────────────────────────────

/** Generate a cryptographically secure 6-digit OTP string. */
export function generateCode(): string {
  return randomInt(OTP_MIN, OTP_MAX + 1).toString();
}

/** Strip whitespace and formatting characters from a phone number. */
export function normalise(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, "");
}

// ── Rate limiting ──────────────────────────────────────────────────

/**
 * Check whether a phone number is allowed to request another OTP.
 * Returns `{ allowed: true }` or `{ allowed: false, retryAfterSec }`.
 */
export function checkRateLimit(
  phone: string
): { allowed: boolean; retryAfterSec: number } {
  const now  = Date.now();
  const norm = normalise(phone);
  const rec  = rateMap.get(norm);

  if (!rec || now >= rec.windowEnd) {
    rateMap.set(norm, { count: 1, windowEnd: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (rec.count >= MAX_SENDS) {
    const retryAfterSec = Math.ceil((rec.windowEnd - now) / 1_000);
    return { allowed: false, retryAfterSec };
  }

  rec.count++;
  return { allowed: true, retryAfterSec: 0 };
}

// ── OTP lifecycle ──────────────────────────────────────────────────

/** Store an OTP for the given phone number, replacing any existing record. */
export function storeOtp(phone: string, code: string): void {
  otpMap.set(normalise(phone), {
    code,
    expires:  Date.now() + OTP_TTL_MS,
    attempts: 0,
    locked:   false,
  });
}

/** Verify a submitted code against the stored OTP. Mutates attempt count. */
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
    return {
      ok:    false,
      error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // ✓ Correct — clean up immediately
  otpMap.delete(norm);
  return { ok: true };
}

/** Remove all expired OTP and rate-limit records. Called automatically. */
export function pruneExpired(): void {
  const now = Date.now();
  for (const [k, v] of otpMap)  if (now > v.expires)    otpMap.delete(k);
  for (const [k, v] of rateMap) if (now >= v.windowEnd)  rateMap.delete(k);
}
