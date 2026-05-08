import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { markAsRead } from "@/services/notification.service";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const updated = await markAsRead(numId, auth.user.id);
  if (!updated) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
  return NextResponse.json({ notification: updated });
}
