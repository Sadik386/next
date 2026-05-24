import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { sendTestEmail } from "@/services/email.service";
import { hasFeatureAccess } from "@/lib/subscription-guard";
import { FEATURE_KEYS } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.EDIT_SETTINGS);
  if (auth instanceof NextResponse) return auth;

  const canUseSmtp = await hasFeatureAccess(auth.businessId, FEATURE_KEYS.CUSTOM_SMTP);
  if (!canUseSmtp) {
    return NextResponse.json(
      {
        success: false,
        message: "Business SMTP is not available on your current plan. Upgrade to Starter or higher to configure business email.",
      },
      { status: 403 }
    );
  }

  try {
    const { to } = await req.json();

    if (!to || typeof to !== "string" || !to.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Valid recipient email is required" },
        { status: 400 }
      );
    }

    const result = await sendTestEmail(to, auth.businessId);

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error("Send test email error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}