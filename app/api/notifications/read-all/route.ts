import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { markAllAsRead } from "@/services/notification.service";

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const result = await markAllAsRead(auth.user.id);
  return NextResponse.json({ updated: result.count });
}
