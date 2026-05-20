import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-auth";
import { isPlatformEmailConfigured, testPlatformSmtp, sendTestPlatformEmail } from "@/services/platform-email.service";

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const isConfigured = isPlatformEmailConfigured();
  const host = process.env.SMTP_HOST || "";
  const fromEmail = process.env.SMTP_FROM_EMAIL || "";
  const fromName = process.env.SMTP_FROM_NAME || "Accoraze Platform";

  return NextResponse.json({
    success: true,
    configured: isConfigured,
    smtpHost: isConfigured ? host : null,
    smtpFromEmail: isConfigured ? fromEmail : null,
    smtpFromName: fromName,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { action, email } = await req.json();

    if (action === "test") {
      const testEmail = email || auth.user.email;
      const result = await sendTestPlatformEmail(testEmail);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Platform email API error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}