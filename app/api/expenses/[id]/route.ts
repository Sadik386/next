import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getExpenseById, getExpenses, updateExpense } from "@/services/expense.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { guardReadOnlyWrite, SubscriptionGuardError } from "@/lib/subscription-guard";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_EXPENSES);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    const { id } = await ctx.params;
    const numericId = Number(id);
    if (Number.isInteger(numericId) && numericId > 0) {
      const expense = await getExpenseById(numericId);
      if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ expense });
    }
    const result = await getExpenses({ search: id, pageSize: 50 });
    const expense = result.items.find(e => e.expenseId.toLowerCase() === id.toLowerCase());
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ expense });
  });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.EDIT_EXPENSE);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    try {
      try {
        await guardReadOnlyWrite(auth.businessId);
      } catch (guardErr) {
        if (guardErr instanceof SubscriptionGuardError) {
          return NextResponse.json({ error: guardErr.message, code: guardErr.code }, { status: guardErr.status });
        }
        throw guardErr;
      }
      const { id } = await ctx.params;
      const body = await req.json();
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
      }
      const expense = await updateExpense(numericId, body, auth.user.id);
      if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      return NextResponse.json({ expense });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Server error";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  });
}
