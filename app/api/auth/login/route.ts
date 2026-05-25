import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/services/auth.service";
import { prisma } from "@/lib/prisma";
import { createLog } from "@/services/activity-log.service";
import { getRequestInfo } from "@/lib/request-info";
import { verifyTurnstileToken } from "@/services/turnstile.service";

// Rate limiter: 5 attempts per 15 minutes per IP
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }

  if (record.count >= 5) return false;

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { ip, userAgent } = getRequestInfo(req);

    // Rate limit check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in 15 minutes." },
        { status: 429 }
      );
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

    const { email, password } = body as { email: string; password: string };
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const result = await loginUser(email, password);
    if (result.error || !result.user) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    const user = result.user;

    // Pass the authenticated user's businessId to createLog
    await createLog({
      userId: user.id,
      action: "login",
      module: "auth",
      entityId: String(user.id),
      entityName: user.name,
      description: `${user.name} logged in`,
      ipAddress: ip,
      userAgent,
      businessId: user.businessId, // Explicitly pass businessId
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });
    
    const response = NextResponse.json({ success: true, user });
    response.cookies.set("auth_token", result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Login error:", err);
    // If the error is related to business context and it's not a handled 401, return 500.
    // The activity log creation has been modified to handle context, so this catch should be for unexpected errors.
    if (err instanceof Error && err.message.includes("Active business context is required")) {
        return NextResponse.json({ error: "Login failed due to missing business context." }, { status: 500 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
