import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { prisma } from "@/lib/prisma";
import { csvResponse, generateCsv, SUPPLIER_COLUMNS } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.BULK_EXPORT_SUPPLIERS);
  if (auth instanceof NextResponse) return auth;

  const suppliers = await prisma.supplier.findMany({
    where: { deletedAt: null },
    orderBy: { id: "asc" },
  });

  const rows = suppliers.map((s) => ({
    "Company Name*": s.companyName,
    "Contact Name*": s.contactName,
    Email: s.email ?? "",
    Mobile: s.mobile ?? "",
    Website: s.website ?? "",
    "Tax ID": s.taxId ?? "",
    "Payment Terms": s.paymentTerms ?? "",
    Currency: s.currency,
    "Bank Name": s.bankName ?? "",
    "Bank Account": s.bankAccount ?? "",
    "Account Name": s.accountName ?? "",
    "Branch Name": s.branchName ?? "",
    "Routing Number": s.routingNumber ?? "",
    "SWIFT Code": s.swiftCode ?? "",
    Bkash: s.bkash ?? "",
    Nagad: s.nagad ?? "",
    Rocket: s.rocket ?? "",
    Upay: s.upay ?? "",
    Category: s.category ?? "",
    "Delivery Method": s.deliveryMethod ?? "",
    "Street Address": s.streetAddress ?? "",
    City: s.city ?? "",
    State: s.state ?? "",
    "Zip Code": s.zipCode ?? "",
    Country: s.country ?? "",
    "Status*": s.status,
  }));

  const csv = generateCsv(rows, SUPPLIER_COLUMNS);
  return csvResponse(`suppliers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}