import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { createExpense, getExpenses } from "@/services/expense.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { hasPermission } from "@/lib/rbac";
import { RoleName } from "@/constants/roles";
import { parseDateRangeFromSearchParams } from "@/lib/date-filter";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.VIEW_EXPENSES)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    const sp = req.nextUrl.searchParams;
    const range = parseDateRangeFromSearchParams(sp);
    const result = await getExpenses({
      search: sp.get("search") ?? undefined,
      category: sp.get("category") ?? undefined,
      paymentMethod: sp.get("paymentMethod") ?? undefined,
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

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.CREATE_EXPENSE)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    try {
      const body = await req.json();
      if (body.amount === undefined || body.amount === null || body.amount === "") {
        return NextResponse.json({ error: "Amount is required" }, { status: 400 });
      }
      if (!body.category) {
        return NextResponse.json({ error: "Category is required" }, { status: 400 });
      }
      if (!body.paymentMethod) {
        return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
      }
      if (!body.vendor) {
        return NextResponse.json({ error: "Vendor is required" }, { status: 400 });
      }
      const expense = await createExpense(body, user.id);
      return NextResponse.json({ expense });
    } catch (err) {
      console.error("Error creating expense:", err);
      const message = err instanceof Error ? err.message : "Server error";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  });
}
