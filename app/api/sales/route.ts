import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { createSale, getSales } from "@/services/sale.service";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_SALES);
  if (auth instanceof NextResponse) return auth;
  const sp = req.nextUrl.searchParams;
  const result = await getSales({
    search: sp.get("search") ?? undefined,
    paymentStatus: sp.get("paymentStatus") ?? undefined,
    returnStatus: sp.get("returnStatus") ?? undefined,
    customerId: sp.get("customerId") ? Number(sp.get("customerId")) : undefined,
    productId: sp.get("productId") ? Number(sp.get("productId")) : undefined,
    fromDate: sp.get("fromDate") ?? undefined,
    toDate: sp.get("toDate") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_SALE);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    if (!body.customerId) {
      return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    }
    if (!body.productId) {
      return NextResponse.json({ error: "Product is required" }, { status: 400 });
    }
    if (body.unitPrice === undefined || body.unitPrice === null || body.unitPrice === "") {
      return NextResponse.json({ error: "Unit price is required" }, { status: 400 });
    }
    const sale = await createSale(body, auth.user.id);
    return NextResponse.json({ sale });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
