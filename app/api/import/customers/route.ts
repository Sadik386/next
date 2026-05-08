import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { ROLES, ROLE_HIERARCHY, RoleName } from "@/constants/roles";
import { prisma } from "@/lib/prisma";
import { generateCustomerId } from "@/services/customer.service";
import { getCellTrimmed, ImportResult, parseCsv } from "@/lib/csv";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_CUSTOMER);
  if (auth instanceof NextResponse) return auth;

  if (ROLE_HIERARCHY[auth.user.role as RoleName] < ROLE_HIERARCHY[ROLES.ADMIN]) {
    return NextResponse.json({ error: "Forbidden — admin or higher required" }, { status: 403 });
  }

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
      const name = getCellTrimmed(row, "Full Name*");
      const email = getCellTrimmed(row, "Email*");
      const phone = getCellTrimmed(row, "Phone*");
      const status = getCellTrimmed(row, "Account Status*") || "active";

      if (!name || !email || !phone) {
        result.skipped++;
        result.errors.push({ row: rowNumber, message: "Missing required fields" });
        continue;
      }

      const country = getCellTrimmed(row, "Country") || null;
      const city = getCellTrimmed(row, "City") || null;
      const streetAddress = getCellTrimmed(row, "Street Address") || null;

      const customerId = await generateCustomerId();
      await prisma.customer.create({
        data: {
          customerId,
          name,
          email,
          mobile: phone,
          country,
          city,
          streetAddress,
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
