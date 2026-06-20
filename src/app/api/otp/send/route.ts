import { NextRequest, NextResponse } from "next/server";
import { normalise, storeOtp } from "@/lib/otpStore";

/**
 * POST /api/otp/send
 *
 * Hardcoded OTP: 123456
 * No SMS, no Twilio. Just stores 123456 for any phone number.
 */

const FIXED_OTP = "123456";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

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

    // Always store 123456 for any phone
    storeOtp(norm, FIXED_OTP);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[OTP send]", err);
    return NextResponse.json({ error: "Failed to send OTP." }, { status: 500 });
  }
}
