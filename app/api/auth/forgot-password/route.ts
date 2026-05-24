import { NextRequest, NextResponse } from "next/server";
import { forgotPassword } from "@/services/auth.service";
import { checkRateLimit, getRateLimitResponse } from "@/lib/rate-limit";
import { getRequestInfo } from "@/lib/request-info";

export async function POST(req: NextRequest) {
  const { ip } = getRequestInfo(req);
  if (!checkRateLimit(ip, { windowMs: 60 * 60 * 1000, maxRequests: 5 })) {
    return NextResponse.json(getRateLimitResponse("Too many requests. Try again in an hour."), { status: 429 });
  }
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const result = await forgotPassword(email);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: result.message });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}