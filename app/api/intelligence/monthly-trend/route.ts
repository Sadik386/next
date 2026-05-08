import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getMonthlyTrend } from "@/services/intelligence.service";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_REPORTS);
  if (auth instanceof NextResponse) return auth;
  try {
    const data = await getMonthlyTrend();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
