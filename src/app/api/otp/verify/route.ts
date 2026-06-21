import { NextRequest, NextResponse } from "next/server";
import { verifyOtp, normalise } from "@/lib/otpStore";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null) as {
      phone?: unknown;
      code?: unknown;
    } | null;

    if (!body?.phone || !body?.code) {
      return NextResponse.json({ error: "Phone and code are required." }, { status: 400 });
    }

    const norm = normalise(String(body.phone));
    const code = String(body.code).trim();

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Code must be exactly 6 digits." }, { status: 400 });
    }

    const result = verifyOtp(norm, code);

    if (!result.ok) {
      const status = result.locked ? 429 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
