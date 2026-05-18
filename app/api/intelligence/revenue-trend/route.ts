import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getRevenueTrend } from "@/services/intelligence.service";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";

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

  const authUser: AuthenticatedUser = {
    id: auth.user.id,
    businessId: auth.businessId,
    role: auth.user.role,
    name: auth.user.name,
    email: auth.user.email,
    username: auth.user.username,
  };

  return runWithBusinessContext(authUser, async () => {
    try {
      const { from, to } = parseRange(req);
      const data = await getRevenueTrend({ from, to });
      return NextResponse.json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
