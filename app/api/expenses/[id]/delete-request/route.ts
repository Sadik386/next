import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { requestDeleteExpense } from "@/services/expense.service";
import { runWithBusinessContext } from "@/lib/business-context";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_DELETE_REQUEST);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    const { id } = await ctx.params;
    const expenseId = Number(id);
    if (!Number.isInteger(expenseId) || expenseId <= 0) {
      return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
    }

    try {
      const { reason } = await req.json();
      if (!reason || typeof reason !== "string" || !reason.trim()) {
        return NextResponse.json({ error: "Reason is required" }, { status: 400 });
      }
      const result = await requestDeleteExpense(expenseId, reason.trim(), auth.user.id);
      if (!result) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      return NextResponse.json({ request: result, message: "Delete request submitted." });
    } catch (err) {
      console.error("Expense delete request error:", err);
      const message =
        err instanceof Error && process.env.NODE_ENV !== "production"
          ? err.message
          : "Failed to submit delete request";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
