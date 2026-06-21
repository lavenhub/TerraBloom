import { describe, it, expect, beforeEach } from "vitest";
import {
  generateCode,
  normalise,
  storeOtp,
  verifyOtp,
  checkRateLimit,
  pruneExpired,
} from "@/lib/otpStore";

describe("generateCode", () => {
  it("generates a 6-digit string", () => {
    const code = generateCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("generates different codes on successive calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("normalise", () => {
  it("strips spaces and hyphens", () => {
    expect(normalise("+91 98765-43210")).toBe("+919876543210");
  });

  it("strips parentheses", () => {
    expect(normalise("+1 (555) 123-4567")).toBe("+15551234567");
  });

  it("leaves a clean number unchanged", () => {
    expect(normalise("+919876543210")).toBe("+919876543210");
  });
});

describe("storeOtp + verifyOtp", () => {
  const phone = "+919000000001";

  beforeEach(() => {
    pruneExpired();
  });

  it("verifies a correct code", () => {
    storeOtp(phone, "123456");
    const result = verifyOtp(phone, "123456");
    expect(result.ok).toBe(true);
  });

  it("rejects an incorrect code", () => {
    storeOtp(phone, "123456");
    const result = verifyOtp(phone, "000000");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Incorrect");
  });

  it("deletes OTP after successful verification", () => {
    storeOtp(phone, "654321");
    verifyOtp(phone, "654321");
    const result = verifyOtp(phone, "654321");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("No OTP found");
  });

  it("returns error when no OTP stored", () => {
    const result = verifyOtp("+919000009999", "123456");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("No OTP found");
  });

  it("locks after 5 incorrect attempts", () => {
    storeOtp(phone, "111111");
    for (let i = 0; i < 5; i++) verifyOtp(phone, "000000");
    const result = verifyOtp(phone, "111111");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.locked).toBe(true);
  });

  it("trims whitespace in code", () => {
    storeOtp(phone, "123456");
    const result = verifyOtp(phone, "  123456  ");
    expect(result.ok).toBe(true);
  });
});

describe("checkRateLimit", () => {
  it("allows first request", () => {
    const phone = "+919100000001";
    const r = checkRateLimit(phone);
    expect(r.allowed).toBe(true);
  });

  it("allows up to 3 requests", () => {
    const phone = "+919100000002";
    checkRateLimit(phone);
    checkRateLimit(phone);
    const third = checkRateLimit(phone);
    expect(third.allowed).toBe(true);
  });

  it("blocks after 3 requests", () => {
    const phone = "+919100000003";
    checkRateLimit(phone);
    checkRateLimit(phone);
    checkRateLimit(phone);
    const fourth = checkRateLimit(phone);
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterSec).toBeGreaterThan(0);
  });
});
