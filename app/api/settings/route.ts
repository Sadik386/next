import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getSettings, updateSettings } from "@/services/setting.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.EDIT_SETTINGS);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const settings = await updateSettings(body, auth.user.id);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
