import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { ROLES, ROLE_HIERARCHY, RoleName } from "@/constants/roles";
import { prisma } from "@/lib/prisma";
import { generateCustomerId } from "@/services/customer.service";
import { getCellTrimmed, ImportResult, parseCsv } from "@/lib/csv";
import { checkRateLimit, getRateLimitResponse } from "@/lib/rate-limit";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_CUSTOMER);
  if (auth instanceof NextResponse) return auth;

  if (!checkRateLimit(`import:${auth.businessId}`, { windowMs: 60 * 1000, maxRequests: 3 })) {
    return NextResponse.json(getRateLimitResponse("Too many import requests. Wait a minute."), { status: 429 });
  }

  // Additional check for role hierarchy (keep existing logic)
  if (ROLE_HIERARCHY[auth.user.role as RoleName] < ROLE_HIERARCHY[ROLES.ADMIN]) {
    return NextResponse.json({ error: "Forbidden: Insufficient role hierarchy." }, { status: 403 });
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
            businessId,
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