import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { prisma } from "@/lib/prisma";
import { generateExpenseId } from "@/services/expense.service";
import { getCellTrimmed, ImportResult, parseCsv } from "@/lib/csv";
import { checkRateLimit, getRateLimitResponse } from "@/lib/rate-limit";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.BULK_IMPORT_EXPENSES);
  if (auth instanceof NextResponse) return auth;

  if (!checkRateLimit(`import:${auth.businessId}`, { windowMs: 60 * 1000, maxRequests: 3 })) {
    return NextResponse.json(getRateLimitResponse("Too many import requests. Wait a minute."), { status: 429 });
  }

  const user = { ...auth.user, businessId: auth.businessId } as AuthenticatedUser;
  const businessId = auth.businessId;

  return runWithBusinessContext(user, async () => {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCsv(text);

    const result: ImportResult = { created: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;
      try {
        const dateRaw = getCellTrimmed(row, "Date*");
        const amountRaw = getCellTrimmed(row, "Amount*");
        const category = getCellTrimmed(row, "Category*");
        const paymentMethod = getCellTrimmed(row, "Payment Method*");
        const vendor = getCellTrimmed(row, "Vendor*");

        if (!amountRaw || !category || !paymentMethod || !vendor) {
          result.skipped++;
          result.errors.push({ row: rowNumber, message: "Missing required fields" });
          continue;
        }

        const amount = Number(amountRaw);
        if (Number.isNaN(amount)) {
          result.skipped++;
          result.errors.push({ row: rowNumber, message: "Invalid amount" });
          continue;
        }

        const date = dateRaw ? new Date(dateRaw) : new Date();
        const taxAmountRaw = getCellTrimmed(row, "Tax Amount");
        const taxPercentRaw = getCellTrimmed(row, "Tax Percent");
        const taxAmount = taxAmountRaw ? Number(taxAmountRaw) : 0;
        const taxPercent = taxPercentRaw ? Number(taxPercentRaw) : 0;

        const expenseId = await generateExpenseId();
        await prisma.expense.create({
          data: {
            businessId,
            expenseId,
            date,
            amount: new Prisma.Decimal(amount),
            currency: getCellTrimmed(row, "Currency") || "BDT",
            category,
            paymentMethod,
            vendor,
            receiptId: getCellTrimmed(row, "Receipt ID") || null,
            referenceNo: getCellTrimmed(row, "Reference No") || null,
            taxAmount: new Prisma.Decimal(taxAmount || 0),
            taxPercent: new Prisma.Decimal(taxPercent || 0),
            description: getCellTrimmed(row, "Description") || null,
            notes: getCellTrimmed(row, "Notes") || null,
            createdBy: user.id,
          },
        });

        result.created++;
      } catch (err) {
        result.skipped++;
        console.error(`Error processing row ${rowNumber}:`, err);
        result.errors.push({
          row: rowNumber,
          message: err instanceof Error ? err.message : "Failed to import row",
        });
      }
    }

    return NextResponse.json(result);
  });
}