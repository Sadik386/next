import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { createSale, getSales, getSalesGrouped } from "@/services/sale.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { hasPermission } from "@/lib/rbac";
import { RoleName } from "@/constants/roles";
import { parseDateRangeFromSearchParams } from "@/lib/date-filter";
import { guardReadOnlyWrite, SubscriptionGuardError } from "@/lib/subscription-guard";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.VIEW_SALES)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    const sp = req.nextUrl.searchParams;
    const range = parseDateRangeFromSearchParams(sp);
    const grouped = sp.get("grouped") === "true";

    const result = grouped
      ? await getSalesGrouped({
          search: sp.get("search") ?? undefined,
          paymentStatus: sp.get("paymentStatus") ?? undefined,
          customerId: sp.get("customerId") ? Number(sp.get("customerId")) : undefined,
          from: range.startDate ?? undefined,
          to: range.endDate ?? undefined,
          page: sp.get("page") ? Number(sp.get("page")) : undefined,
          pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
        })
      : await getSales({
          search: sp.get("search") ?? undefined,
          paymentStatus: sp.get("paymentStatus") ?? undefined,
          returnStatus: sp.get("returnStatus") ?? undefined,
          customerId: sp.get("customerId") ? Number(sp.get("customerId")) : undefined,
          productId: sp.get("productId") ? Number(sp.get("productId")) : undefined,
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

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.CREATE_SALE)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    try {
      await guardReadOnlyWrite(user.businessId!);
    } catch (guardErr) {
      if (guardErr instanceof SubscriptionGuardError) {
        return NextResponse.json({ error: guardErr.message, code: guardErr.code }, { status: guardErr.status });
      }
      throw guardErr;
    }

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
      const sale = await createSale(body, user.id);
      return NextResponse.json({ sale });
    } catch (err) {
      if (err instanceof SubscriptionGuardError) {
        return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
      }
      console.error("Error creating sale:", err);
      const message = err instanceof Error ? err.message : "Server error";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  });
}
