import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-auth";

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    success: true,
    user: auth.user,
  });
}
