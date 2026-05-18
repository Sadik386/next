import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { RoleName } from "@/constants/roles";
import { markAsRead } from "@/services/notification.service";
import { runWithBusinessContext } from "@/lib/business-context";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const role = user.role as RoleName;

  return runWithBusinessContext(user, async () => {
    const updated = await markAsRead(numId, user.id, role);
    if (!updated) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    return NextResponse.json({ notification: updated });
  });
}
