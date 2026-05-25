import { NextRequest, NextResponse } from "next/server";
import { resendVerificationEmail } from "@/services/email-verification.service";
import { checkRateLimit, getRateLimitResponse } from "@/lib/rate-limit";
import { getRequestInfo } from "@/lib/request-info";

export async function POST(req: NextRequest) {
  const { ip } = getRequestInfo(req);

  if (!checkRateLimit(ip, { windowMs: 60 * 60 * 1000, maxRequests: 5 })) {
    return NextResponse.json(
      getRateLimitResponse("Too many requests. Please try again in an hour."),
      { status: 429 }
    );
  }

  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ success: false, message: "Email is required." }, { status: 400 });
  }

  const result = await resendVerificationEmail(email);

  return NextResponse.json({ success: result.success, message: result.message });
}