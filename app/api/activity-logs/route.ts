import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { getActivityLogs } from "@/services/activity-log.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { hasPermission } from "@/lib/rbac";
import { RoleName } from "@/constants/roles";
import { parseDateRangeFromSearchParams } from "@/lib/date-filter";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.VIEW_ACTIVITY_LOGS)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    const sp = req.nextUrl.searchParams;
    const range = parseDateRangeFromSearchParams(sp);
    const result = await getActivityLogs({
      module: sp.get("module") ?? undefined,
      action: sp.get("action") ?? undefined,
      search: sp.get("search") ?? undefined,
      ipAddress: sp.get("ipAddress") ?? undefined,
      from: range.startDate ?? undefined,
      to: range.endDate ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });

    return NextResponse.json(result);
  });
}
