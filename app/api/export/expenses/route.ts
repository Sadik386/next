import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { prisma } from "@/lib/prisma";
import { csvResponse, generateCsv, EXPENSE_COLUMNS } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.BULK_EXPORT_EXPENSES);
  if (auth instanceof NextResponse) return auth;

  const expenses = await prisma.expense.findMany({
    where: { deletedAt: null },
    orderBy: { id: "asc" },
  });

  const rows = expenses.map((e) => ({
    "Date*": e.date.toISOString().slice(0, 10),
    "Amount*": e.amount.toString(),
    Currency: e.currency,
    "Category*": e.category,
    "Payment Method*": e.paymentMethod,
    "Vendor*": e.vendor,
    "Receipt ID": e.receiptId ?? "",
    "Reference No": e.referenceNo ?? "",
    "Tax Amount": e.taxAmount.toString(),
    "Tax Percent": e.taxPercent.toString(),
    Description: e.description ?? "",
    Notes: e.notes ?? "",
  }));

  const csv = generateCsv(rows, EXPENSE_COLUMNS);
  return csvResponse(`expenses-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}