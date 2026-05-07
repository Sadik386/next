import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getSaleById, updateSale } from "@/services/sale.service";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_SALES);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const sale = await getSaleById(Number(id));
  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ sale });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_SALE);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const sale = await updateSale(Number(id), body, auth.user.id);
    if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    return NextResponse.json({ sale });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
