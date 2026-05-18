import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { prisma } from "@/lib/prisma";
import { csvResponse, generateCsv, SUPPLIER_COLUMNS } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.BULK_EXPORT_SUPPLIERS);
  if (auth instanceof NextResponse) return auth;

  const suppliers = await prisma.supplier.findMany({
    where: { deletedAt: null, businessId: auth.businessId },
    orderBy: { id: "asc" },
  });

  const rows = suppliers.map((s) => ({
    "Company Name*": s.companyName,
    "Contact Name*": s.contactName,
    Email: s.email ?? "",
    "Mobile*": s.mobile ?? "",
    "Payment Terms*": s.paymentTerms ?? "",
    "Currency*": s.currency,
    "Tax ID": s.taxId ?? "",
    Website: s.website ?? "",
    Category: s.category ?? "",
    "Delivery Method": s.deliveryMethod ?? "",
    "Street Address": s.streetAddress ?? "",
    City: s.city ?? "",
    State: s.state ?? "",
    "Zip Code": s.zipCode ?? "",
    "Country*": s.country ?? "",
    "Status*": s.status,
    "Payment Methods": s.paymentMethods ? JSON.stringify(s.paymentMethods) : "",
  }));

  const csv = generateCsv(rows, SUPPLIER_COLUMNS);
  return csvResponse(`suppliers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}