import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSettings, updateSettings } from "@/services/setting.service";
import { PERMISSIONS } from "@/constants/permissions";
import { runWithBusinessContext } from "@/lib/business-context";
import { hasPermission } from "@/lib/rbac";
import { RoleName } from "@/constants/roles";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    const settings = await getSettings();
    return NextResponse.json({ settings });
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.EDIT_SETTINGS)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    try {
      const body = await req.json();
      const settings = await updateSettings(body, user.id);
      return NextResponse.json({ settings });
    } catch (error) {
      console.error("Error updating settings:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  });
}
