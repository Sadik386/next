import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-auth";
import { 
  getPlatformEmailSafeConfig, 
  savePlatformEmailConfig,
  sendTestPlatformEmail 
} from "@/services/platform-email.service";

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const config = await getPlatformEmailSafeConfig();
    return NextResponse.json({
      success: true,
      ...config,
    });
  } catch (error) {
    console.error("Platform email GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to load configuration" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { action, data, email } = body;

    if (action === "save") {
      const { host, port, secure, user, password, fromEmail, fromName, replyTo } = data;

      if (!host || !user || !fromEmail) {
        return NextResponse.json({ success: false, message: "Host, username, and from email are required" }, { status: 400 });
      }

      const result = await savePlatformEmailConfig({
        host,
        port: port || 587,
        secure: secure || false,
        user,
        password: password || "",
        fromEmail,
        fromName: fromName || "NextGen Cloud POS Platform",
        replyTo,
      });

      return NextResponse.json(result);
    }

    if (action === "test") {
      if (!email) {
        return NextResponse.json({ success: false, message: "Test recipient email is required" }, { status: 400 });
      }
      const result = await sendTestPlatformEmail(email);
      
      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }
      return NextResponse.json({ 
        success: true, 
        message: `Test email sent to ${email}` 
      });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Platform email POST error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}