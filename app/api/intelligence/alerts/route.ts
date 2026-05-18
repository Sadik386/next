import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getIntelligenceAlerts, AlertType } from "@/services/intelligence.service";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";

const VALID_TYPES: AlertType[] = ["critical", "warning", "info", "success"];

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
      const sp = req.nextUrl.searchParams;
      const typeParam = sp.get("type");
      const page = Math.max(1, Number(sp.get("page")) || 1);
      const limit = Math.min(200, Math.max(1, Number(sp.get("limit")) || 50));

      const all = await getIntelligenceAlerts();
      const filtered =
        typeParam && VALID_TYPES.includes(typeParam as AlertType)
          ? all.filter((a) => a.type === typeParam)
          : all;
      const total = filtered.length;
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);

      const counts = {
        total: all.length,
        critical: all.filter((a) => a.type === "critical").length,
        warning: all.filter((a) => a.type === "warning").length,
        info: all.filter((a) => a.type === "info").length,
        success: all.filter((a) => a.type === "success").length,
      };

      return NextResponse.json({ items, total, page, limit, counts });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
