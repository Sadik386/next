import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { createPosSession } from "@/services/pos.service";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.USE_POS);
  if (auth instanceof NextResponse) return auth;

  const session = await createPosSession(auth.user.id);
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const mobileUrl = `${baseUrl.replace(/\/$/, "")}/pos/mobile?session=${session.id}`;

  return NextResponse.json({
    sessionId: session.id,
    mobileUrl,
    expiresAt: session.expiresAt.toISOString(),
  });
}
