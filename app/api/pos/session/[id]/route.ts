import { NextRequest, NextResponse } from "next/server";
import { PERMISSIONS } from "@/constants/permissions";
import { requirePermission } from "@/lib/rbac";
import {
  endPosSession,
  getBusinessIdFromPosSessionToken,
  getPosSession,
} from "@/services/pos.service";

async function resolveSessionBusinessId(req: NextRequest, shortId: string) {
  const tokenBusinessId = getBusinessIdFromPosSessionToken(
    shortId,
    req.nextUrl.searchParams.get("token")
  );
  if (tokenBusinessId) return tokenBusinessId;

  const auth = await requirePermission(req, PERMISSIONS.USE_POS);
  if (auth instanceof NextResponse) return auth;
  return auth.businessId;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const businessId = await resolveSessionBusinessId(req, id);
  if (businessId instanceof NextResponse) return businessId;

  const session = await getPosSession(id, businessId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  let scans: unknown = [];
  try {
    scans = JSON.parse(session.scans ?? "[]");
  } catch {
    scans = [];
  }

  return NextResponse.json({
    sessionId: session.shortId,
    status: session.status,
    scans,
    expiresAt: session.expiresAt.toISOString(),
  });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.USE_POS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const session = await endPosSession(id, auth.businessId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
