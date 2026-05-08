import { NextRequest, NextResponse } from "next/server";
import { endPosSession, getPosSession } from "@/services/pos.service";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getPosSession(id);
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

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await endPosSession(id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
