import { NextRequest, NextResponse } from "next/server";
import { resendVerificationEmail } from "@/services/email-verification.service";
import { checkRateLimit, getRateLimitResponse } from "@/lib/rate-limit";
import { getRequestInfo } from "@/lib/request-info";
import { verifyTurnstileToken } from "@/services/turnstile.service";

export async function POST(req: NextRequest) {
  const { ip } = getRequestInfo(req);

  if (!checkRateLimit(ip, { windowMs: 60 * 60 * 1000, maxRequests: 5 })) {
    return NextResponse.json(
      getRateLimitResponse("Too many requests. Please try again in an hour."),
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
  }

  const turnstileToken = body.turnstileToken as string | undefined;
  if (!turnstileToken) {
    return NextResponse.json({ success: false, message: "CAPTCHA verification failed. Please try again." }, { status: 400 });
  }
  const turnstileResult = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResult.success) {
    return NextResponse.json({ success: false, message: "CAPTCHA verification failed. Please try again." }, { status: 400 });
  }

  const { email } = body as { email: string };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ success: false, message: "Email is required." }, { status: 400 });
  }

  const result = await resendVerificationEmail(email);

  return NextResponse.json({ success: result.success, message: result.message });
}