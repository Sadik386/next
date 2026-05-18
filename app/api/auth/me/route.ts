import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({
    success: true,
    user: auth.user,
    businessId: auth.businessId,
    data: {
      user: auth.user,
      businessId: auth.businessId,
    },
  });
}
