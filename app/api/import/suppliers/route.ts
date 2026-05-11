import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { prisma } from "@/lib/prisma";
import { generateSupplierId } from "@/services/supplier.service";
import { getCellTrimmed, ImportResult, parseCsv } from "@/lib/csv";
import { getCurrentBusinessId } from "@/lib/business";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.BULK_IMPORT_SUPPLIERS);
  if (auth instanceof NextResponse) return auth;

  const businessId = getCurrentBusinessId();
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
      const companyName = getCellTrimmed(row, "Company Name*");
      const contactName = getCellTrimmed(row, "Contact Name*");
      const status = getCellTrimmed(row, "Status*") || "active";

      if (!companyName || !contactName) {
        result.skipped++;
        result.errors.push({ row: rowNumber, message: "Missing required fields" });
        continue;
      }

      const supplierId = await generateSupplierId();
      await prisma.supplier.create({
        data: {
          businessId,
          supplierId,
          companyName,
          contactName,
          email: getCellTrimmed(row, "Email") || null,
          mobile: getCellTrimmed(row, "Mobile") || null,
          website: getCellTrimmed(row, "Website") || null,
          taxId: getCellTrimmed(row, "Tax ID") || null,
          paymentTerms: getCellTrimmed(row, "Payment Terms") || null,
          currency: getCellTrimmed(row, "Currency") || "BDT",
          bankName: getCellTrimmed(row, "Bank Name") || null,
          bankAccount: getCellTrimmed(row, "Bank Account") || null,
          accountName: getCellTrimmed(row, "Account Name") || null,
          branchName: getCellTrimmed(row, "Branch Name") || null,
          routingNumber: getCellTrimmed(row, "Routing Number") || null,
          swiftCode: getCellTrimmed(row, "SWIFT Code") || null,
          bkash: getCellTrimmed(row, "Bkash") || null,
          nagad: getCellTrimmed(row, "Nagad") || null,
          rocket: getCellTrimmed(row, "Rocket") || null,
          upay: getCellTrimmed(row, "Upay") || null,
          category: getCellTrimmed(row, "Category") || null,
          deliveryMethod: getCellTrimmed(row, "Delivery Method") || null,
          streetAddress: getCellTrimmed(row, "Street Address") || null,
          city: getCellTrimmed(row, "City") || null,
          state: getCellTrimmed(row, "State") || null,
          zipCode: getCellTrimmed(row, "Zip Code") || null,
          country: getCellTrimmed(row, "Country") || null,
          status,
        },
      });

      result.created++;
    } catch (err) {
      result.skipped++;
      result.errors.push({
        row: rowNumber,
        message: err instanceof Error ? err.message : "Failed to import row",
      });
    }
  }

  return NextResponse.json(result);
}