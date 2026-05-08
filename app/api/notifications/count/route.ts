import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getUnreadCount } from "@/services/notification.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const count = await getUnreadCount(auth.user.id);
  return NextResponse.json({ count });
}
