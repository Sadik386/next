import { NextRequest, NextResponse } from "next/server";
import { getProductScanSession } from "@/services/scanner.service";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = getProductScanSession(id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  return NextResponse.json({
    sessionId: session.id,
    status: session.status,
    scannedCode: session.scannedCode,
    expiresAt: session.expiresAt.toISOString(),
  });
}