import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getExpenseById, updateExpense } from "@/services/expense.service";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_EXPENSES);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const expense = await getExpenseById(Number(id));
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ expense });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.EDIT_EXPENSE);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const expense = await updateExpense(Number(id), body, auth.user.id);
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    return NextResponse.json({ expense });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
