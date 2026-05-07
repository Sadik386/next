import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { createOrder, getOrders } from "@/services/order.service";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_ORDERS);
  if (auth instanceof NextResponse) return auth;
  const sp = req.nextUrl.searchParams;
  const result = await getOrders({
    search: sp.get("search") ?? undefined,
    status: sp.get("status") ?? undefined,
    paymentStatus: sp.get("paymentStatus") ?? undefined,
    customerId: sp.get("customerId") ? Number(sp.get("customerId")) : undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_ORDER);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    if (!body.customerId) {
      return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }
    const order = await createOrder(body, auth.user.id);
    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
