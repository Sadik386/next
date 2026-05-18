import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getSettings } from "@/services/setting.service";
import { generateExpenseSlipPDF } from "@/lib/pdf/expenseSlip";
import { runWithBusinessContext } from "@/lib/business-context";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_EXPENSES);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    try {
      const { expenseId } = await params;
      const id = Number(expenseId);

      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "Invalid expense ID" }, { status: 400 });
      }

      const expense = await prisma.expense.findFirst({
        where: { id, businessId: auth.businessId, deletedAt: null },
        include: {
          createdByUser: { select: { id: true, name: true, email: true } },
        },
      });
      if (!expense) {
        return NextResponse.json({ error: "Expense not found or access denied" }, { status: 404 });
      }

      const settings = await getSettings();
      const currencySymbol = currencyPrefix(settings?.currency);

      const data = {
        expenseId: expense.expenseId,
        date: new Date(expense.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        business: {
          name: settings?.businessName || "My Business",
          address: settings?.address ? `${settings.address}${settings.city ? ", " + settings.city : ""}` : undefined,
          phone: settings?.phone ?? undefined,
          email: settings?.email ?? undefined,
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
        taxPercent: Number(expense.taxPercent) || undefined,
        description: expense.description ?? undefined,
        notes: expense.notes ?? undefined,
        preparedBy: expense.createdByUser?.name ?? "N/A",
      };

      const pdfBlob = await generateExpenseSlipPDF(data);

      return new NextResponse(pdfBlob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="expense-${expense.expenseId}.pdf"`,
        },
      });
    } catch (err) {
      console.error("Expense PDF generation error:", err);
      const message =
        err instanceof Error && process.env.NODE_ENV !== "production"
          ? err.message
          : "Failed to generate expense PDF";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}

function currencyPrefix(currency: string | null | undefined) {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "EUR ";
  if (currency === "BDT" || !currency) return "Tk ";
  return `${currency} `;
}
