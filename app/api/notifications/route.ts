import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { RoleName } from "@/constants/roles";
import { getNotifications, getRecentNotifications } from "@/services/notification.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const role = auth.user.role as RoleName;

  const sp = req.nextUrl.searchParams;
  const recent = sp.get("recent");

  if (recent) {
    const limit = sp.get("limit") ? Number(sp.get("limit")) : 5;
    const items = await getRecentNotifications(auth.user.id, role, limit);
    return NextResponse.json({ items });
  }

  const statusParam = sp.get("status");
  const status =
    statusParam === "unread" || statusParam === "read" || statusParam === "all"
      ? statusParam
      : undefined;

  const result = await getNotifications(auth.user.id, role, {
    status,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });

  return NextResponse.json(result);
}
