import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/services/auth.service";
import { checkRateLimit, getRateLimitResponse } from "@/lib/rate-limit";
import { getRequestInfo } from "@/lib/request-info";

export async function POST(req: NextRequest) {
  const { ip } = getRequestInfo(req);
  if (!checkRateLimit(ip, { windowMs: 60 * 60 * 1000, maxRequests: 10 })) {
    return NextResponse.json(getRateLimitResponse("Too many reset attempts. Try again in an hour."), { status: 429 });
  }
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
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
