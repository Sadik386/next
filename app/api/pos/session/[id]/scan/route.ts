import { NextRequest, NextResponse } from "next/server";
import { appendScan } from "@/services/pos.service";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: { barcode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const barcode = (body.barcode ?? "").toString();
  if (!barcode.trim()) {
    return NextResponse.json({ error: "Barcode is required" }, { status: 400 });
  }

  const result = await appendScan(id, barcode);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
