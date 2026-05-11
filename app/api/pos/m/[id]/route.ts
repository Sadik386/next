import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const shortId = `MOB-${id}`;
  return NextResponse.redirect(new URL(`/pos/mobile?session=${shortId}`, req.url));
}