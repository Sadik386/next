import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getSaleById, getSales, updateSale } from "@/services/sale.service";
import { runWithBusinessContext } from "@/lib/business-context";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_SALES);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    const { id } = await ctx.params;
    const numericId = Number(id);
    if (Number.isInteger(numericId) && numericId > 0) {
      const sale = await getSaleById(numericId);
      if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ sale });
    }
    const result = await getSales({ search: id, pageSize: 50 });
    const sale = result.items.find(s => s.saleId.toLowerCase() === id.toLowerCase());
    if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ sale });
  });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_SALE);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    try {
      const { id } = await ctx.params;
      const body = await req.json();
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        return NextResponse.json({ error: "Invalid sale ID" }, { status: 400 });
      }
      const sale = await updateSale(numericId, body, auth.user.id);
      if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
      return NextResponse.json({ sale });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Server error";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  });
}
