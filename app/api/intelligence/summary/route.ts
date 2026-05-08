import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getIntelligenceSummary } from "@/services/intelligence.service";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_REPORTS);
  if (auth instanceof NextResponse) return auth;
  try {
    const summary = await getIntelligenceSummary();
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
