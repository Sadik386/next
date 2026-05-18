import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { RoleName } from "@/constants/roles";
import { markAllAsRead } from "@/services/notification.service";
import { runWithBusinessContext } from "@/lib/business-context";

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  const role = user.role as RoleName;

  return runWithBusinessContext(user, async () => {
    const result = await markAllAsRead(user.id, role);
    return NextResponse.json({ updated: result.count });
  });
}
