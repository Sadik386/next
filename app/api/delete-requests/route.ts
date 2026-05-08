import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getDeleteRequests } from "@/services/delete-request.service";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_DELETE_REQUESTS);
  if (auth instanceof NextResponse) return auth;

  const sp = req.nextUrl.searchParams;
  const result = await getDeleteRequests({
    status: sp.get("status") ?? undefined,
    entityType: sp.get("entityType") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });

  return NextResponse.json(result);
}
