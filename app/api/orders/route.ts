import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { createOrder, getOrders } from "@/services/order.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { hasPermission } from "@/lib/rbac";
import { RoleName } from "@/constants/roles";
import { parseDateRangeFromSearchParams } from "@/lib/date-filter";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.VIEW_ORDERS)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    const sp = req.nextUrl.searchParams;
    const range = parseDateRangeFromSearchParams(sp);
    const result = await getOrders({
      search: sp.get("search") ?? undefined,
      status: sp.get("status") ?? undefined,
      paymentStatus: sp.get("paymentStatus") ?? undefined,
      customerId: sp.get("customerId") ? Number(sp.get("customerId")) : undefined,
      from: range.startDate ?? undefined,
      to: range.endDate ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });
    return NextResponse.json(result);
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.CREATE_ORDER)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    try {
      const body = await req.json();
      if (!body.customerId) {
        return NextResponse.json({ error: "Customer is required" }, { status: 400 });
      }
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
      }
      const order = await createOrder(body, user.id);
      return NextResponse.json({ order });
    } catch (err) {
      console.error("Error creating order:", err);
      const message = err instanceof Error ? err.message : "Server error";
      const status =
        message === "Customer not found" || message === "Product not found" ? 404 : 400;
      return NextResponse.json({ error: message }, { status });
    }
  });
}
