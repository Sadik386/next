import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { getProfitReport } from "@/services/report.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { hasPermission } from "@/lib/rbac";
import { RoleName } from "@/constants/roles";
import { endOfDay, parseDateRangeFromSearchParams } from "@/lib/date-filter";

function parseRange(req: NextRequest): { from: Date; to: Date } {
  const sp = req.nextUrl.searchParams;
  const range = parseDateRangeFromSearchParams(sp, { defaultPreset: "last_28_days" });
  const to = range.endDate ?? endOfDay(new Date());
  const from = range.startDate ?? new Date(0);
  return { from, to };
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.VIEW_REPORTS)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    try {
      const { from, to } = parseRange(req);
      const report = await getProfitReport(from, to);
      return NextResponse.json(report);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
