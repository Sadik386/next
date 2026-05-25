import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/services/auth.service";
import { checkRateLimit, getRateLimitResponse } from "@/lib/rate-limit";
import { getRequestInfo } from "@/lib/request-info";
import { verifyTurnstileToken } from "@/services/turnstile.service";

export async function POST(req: NextRequest) {
  const { ip } = getRequestInfo(req);
  if (!checkRateLimit(ip, { windowMs: 60 * 60 * 1000, maxRequests: 10 })) {
    return NextResponse.json(getRateLimitResponse("Too many reset attempts. Try again in an hour."), { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const turnstileToken = body.turnstileToken as string | undefined;
  if (!turnstileToken) {
    return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 400 });
  }
  const turnstileResult = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResult.success) {
    return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 400 });
  }

  const { token, password } = body as { token: string; password: string };
  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  try {
    const result = await resetPassword(token, password);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
