import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getExpenseById } from "@/services/expense.service";
import { getSettings } from "@/services/setting.service";
import { generateExpenseSlipPDF } from "@/lib/pdf/expenseSlip";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { expenseId } = await params;
  const id = Number(expenseId);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
  }

  const expense = await getExpenseById(id);
  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const settings = await getSettings();
  const currencySymbol = settings?.currency === "USD" ? "$" : settings?.currency === "EUR" ? "€" : "৳";

  const data = {
    expenseId: expense.expenseId,
    date: new Date(expense.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    business: {
      name: settings?.businessName || "My Business",
      address: settings?.address ? `${settings.address}${settings.city ? ", " + settings.city : ""}` : undefined,
      phone: settings?.phone ?? undefined,
    },
    vendor: expense.vendor,
    category: expense.category,
    amount: Number(expense.amount),
    currency: expense.currency,
    currencySymbol,
    paymentMethod: expense.paymentMethod,
    receiptId: expense.receiptId ?? undefined,
    referenceNo: expense.referenceNo ?? undefined,
    taxAmount: Number(expense.taxAmount) || undefined,
    description: expense.description ?? undefined,
    notes: expense.notes ?? undefined,
    preparedBy: expense.createdByUser?.name ?? "N/A",
  };

  const pdfBlob = await generateExpenseSlipPDF(data);

  return new Response(pdfBlob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="expense-${expense.expenseId}.pdf"`,
    },
  });
}