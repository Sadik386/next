import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import {
  getBusinessIdFromProductScanSessionToken,
  getProductScanSession,
} from "@/services/scanner.service";

async function resolveSessionBusinessId(req: NextRequest, sessionId: string) {
  const tokenBusinessId = getBusinessIdFromProductScanSessionToken(
    sessionId,
    req.nextUrl.searchParams.get("token")
  );
  if (tokenBusinessId) return tokenBusinessId;

  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  return auth.businessId;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const businessId = await resolveSessionBusinessId(req, id);
  if (businessId instanceof NextResponse) return businessId;

  const session = getProductScanSession(id, businessId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  return NextResponse.json({
    sessionId: session.id,
    status: session.status,
    scannedCode: session.scannedCode,
    product: session.product,
    expiresAt: session.expiresAt.toISOString(),
  });
}
