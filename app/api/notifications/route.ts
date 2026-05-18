import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { RoleName } from "@/constants/roles";
import { getNotifications, getRecentNotifications } from "@/services/notification.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { parseDateRangeFromSearchParams } from "@/lib/date-filter";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  const role = user.role as RoleName;
  const sp = req.nextUrl.searchParams;
  const recent = sp.get("recent");

  return runWithBusinessContext(user, async () => {
    if (recent) {
      const limit = sp.get("limit") ? Number(sp.get("limit")) : 5;
      const items = await getRecentNotifications(user.id, role, limit);
      return NextResponse.json({ items });
    }

    const statusParam = sp.get("status");
    const status =
      statusParam === "unread" || statusParam === "read" || statusParam === "all"
        ? statusParam
        : undefined;
    const range = parseDateRangeFromSearchParams(sp);

    const result = await getNotifications(user.id, role, {
      status,
      from: range.startDate ?? undefined,
      to: range.endDate ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });

    return NextResponse.json(result);
  });
}
