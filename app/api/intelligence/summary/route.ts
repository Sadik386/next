import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getIntelligenceSummary } from "@/services/intelligence.service";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";

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
      const summary = await getIntelligenceSummary();
      return NextResponse.json(summary);
    } catch (err) {
      console.error("Error fetching intelligence summary:", err);
      const message = err instanceof Error ? err.message : "Server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}