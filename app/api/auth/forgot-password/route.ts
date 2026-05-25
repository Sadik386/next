import { NextRequest, NextResponse } from "next/server";
import { forgotPassword } from "@/services/auth.service";
import { checkRateLimit, getRateLimitResponse } from "@/lib/rate-limit";
import { getRequestInfo } from "@/lib/request-info";
import { verifyTurnstileToken } from "@/services/turnstile.service";

export async function POST(req: NextRequest) {
  const { ip } = getRequestInfo(req);
  if (!checkRateLimit(ip, { windowMs: 60 * 60 * 1000, maxRequests: 5 })) {
    return NextResponse.json(getRateLimitResponse("Too many requests. Try again in an hour."), { status: 429 });
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

  const { email } = body as { email: string };
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  try {
    const result = await forgotPassword(email);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: result.message });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}