import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getActivityLogs } from "@/services/activity-log.service";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_ACTIVITY_LOGS);
  if (auth instanceof NextResponse) return auth;

  const sp = req.nextUrl.searchParams;
  const result = await getActivityLogs({
    module: sp.get("module") ?? undefined,
    action: sp.get("action") ?? undefined,
    search: sp.get("search") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });

  return NextResponse.json(result);
}
