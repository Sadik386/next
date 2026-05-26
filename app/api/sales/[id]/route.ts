import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getSaleByAnyId, updateSale } from "@/services/sale.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { guardReadOnlyWrite, SubscriptionGuardError } from "@/lib/subscription-guard";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_SALES);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    const { id } = await ctx.params;
    const sale = await getSaleByAnyId(id);
    if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ sale });
  });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_SALE);
  if (auth instanceof NextResponse) return auth;

  try {
    await guardReadOnlyWrite(auth.businessId);
  } catch (guardErr) {
    if (guardErr instanceof SubscriptionGuardError) {
      return NextResponse.json({ error: guardErr.message, code: guardErr.code }, { status: guardErr.status });
    }
    throw guardErr;
  }

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
      if (err instanceof SubscriptionGuardError) {
        return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
      }
      const message = err instanceof Error ? err.message : "Server error";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  });
}
