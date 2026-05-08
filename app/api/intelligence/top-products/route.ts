import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getTopProducts, TopProductMetric } from "@/services/intelligence.service";

function parseRange(req: NextRequest): { from: Date; to: Date } {
  const sp = req.nextUrl.searchParams;
  const fromParam = sp.get("from");
  const toParam = sp.get("to");
  const to = toParam ? new Date(toParam) : new Date();
  const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - 29 * 86400_000);
  return { from, to };
}

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_REPORTS);
  if (auth instanceof NextResponse) return auth;
  try {
    const { from, to } = parseRange(req);
    const sp = req.nextUrl.searchParams;
    const limit = Math.min(50, Math.max(1, Number(sp.get("limit")) || 10));
    const metricParam = sp.get("metric");
    const metric: TopProductMetric = metricParam === "quantity" ? "quantity" : "revenue";
    const items = await getTopProducts({ from, to, limit, metric });
    return NextResponse.json({ items, metric });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
