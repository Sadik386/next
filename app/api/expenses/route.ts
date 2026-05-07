import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { createExpense, getExpenses } from "@/services/expense.service";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_EXPENSES);
  if (auth instanceof NextResponse) return auth;
  const sp = req.nextUrl.searchParams;
  const result = await getExpenses({
    search: sp.get("search") ?? undefined,
    category: sp.get("category") ?? undefined,
    paymentMethod: sp.get("paymentMethod") ?? undefined,
    fromDate: sp.get("fromDate") ?? undefined,
    toDate: sp.get("toDate") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_EXPENSE);
  if (auth instanceof NextResponse) return auth;
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
    const expense = await createExpense(body, auth.user.id);
    return NextResponse.json({ expense });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
