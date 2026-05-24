import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getSettings } from "@/services/setting.service";
import { generateExpenseSlipPDF } from "@/lib/pdf/expenseSlip";
import { runWithBusinessContext } from "@/lib/business-context";
import { guardPdfPrintUsage, incrementUsageSafely } from "@/lib/subscription-guard";
import { USAGE_KEYS } from "@/lib/pricing";
import { checkPdfUsageCount } from "@/lib/subscription-guard";
import { buildDocumentProfile, toBusinessInfo } from "@/lib/pdf/documentProfile";
import { formatDocumentDate } from "@/lib/pdf/formatters";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_EXPENSES);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    const guard = await guardPdfPrintUsage(auth.businessId);
    if (!guard.allowed) {
      return NextResponse.json({ error: guard.reason || "PDF/Print limit reached for your current plan." }, { status: 403 });
    }

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
      const profile = buildDocumentProfile(settings);

      const data = {
        expenseId: expense.expenseId,
        date: formatDocumentDate(expense.date),
        business: toBusinessInfo(profile),
        vendor: expense.vendor,
        category: expense.category,
        amount: Number(expense.amount),
        currency: expense.currency,
        currencySymbol: profile.currencySymbol,
        paymentMethod: expense.paymentMethod,
        receiptId: expense.receiptId ?? undefined,
        referenceNo: expense.referenceNo ?? undefined,
        taxAmount: Number(expense.taxAmount) || undefined,
        taxPercent: Number(expense.taxPercent) || undefined,
        description: expense.description ?? undefined,
        notes: expense.notes ?? undefined,
        preparedBy: expense.createdByUser?.name ?? "",
        approvedBy: undefined,
      };

      const pdfBlob = await generateExpenseSlipPDF(data);

      const docId = id.toString();
      const { counted } = checkPdfUsageCount(auth.businessId, "expense", docId);
      if (counted) {
        incrementUsageSafely(auth.businessId, USAGE_KEYS.PDF_PRINT_COUNT);
      }

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
