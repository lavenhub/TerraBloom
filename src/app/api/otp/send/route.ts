import { NextRequest, NextResponse } from "next/server";
import { normalise, storeOtp, checkRateLimit } from "@/lib/otpStore";

/**
 * POST /api/otp/send
 * Stores a hardcoded OTP (123456) for demo purposes.
 * Rate-limited to 3 requests per phone per 10 minutes.
 */

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // ── Simple origin check (Security) ────────────────────────────
    const origin = req.headers.get("origin");
    if (process.env.NODE_ENV === "production" && origin && !origin.includes("terrabloom")) {
      return NextResponse.json({ error: "Unauthorized origin" }, { status: 403 });
    }

    const body = await req.json().catch(() => null) as { phone?: unknown } | null;

    if (!body?.phone || typeof body.phone !== "string") {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const norm = normalise(body.phone);
    if (!norm.startsWith("+") || norm.length < 8 || norm.length > 16) {
      return NextResponse.json(
        { error: "Phone number must include a country code e.g. +91…" },
        { status: 400 }
      );
    }

    // ── Rate limiting ─────────────────────────────────────────────
    const rate = checkRateLimit(norm);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rate.retryAfterSec}s before trying again.` },
        { status: 429 }
      );
    }

    // ── Store OTP (hardcoded 123456 for demo) ─────────────────────
    storeOtp(norm, "123456");

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send OTP.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
