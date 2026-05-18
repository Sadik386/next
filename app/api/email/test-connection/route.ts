import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { testSmtpConnection } from "@/services/email.service";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.EDIT_SETTINGS);
  if (auth instanceof NextResponse) return auth;

  try {
    const result = await testSmtpConnection(auth.businessId);

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error("SMTP test connection error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}