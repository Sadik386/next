import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { ROLES, ROLE_HIERARCHY, RoleName } from "@/constants/roles";
import { prisma } from "@/lib/prisma";
import { generateOrderId } from "@/services/order.service";
import { getCellTrimmed, ImportResult, parseCsv } from "@/lib/csv";
import { checkRateLimit, getRateLimitResponse } from "@/lib/rate-limit";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_ORDER);
  if (auth instanceof NextResponse) return auth;

  if (!checkRateLimit(`import:${auth.businessId}`, { windowMs: 60 * 1000, maxRequests: 3 })) {
    return NextResponse.json(getRateLimitResponse("Too many import requests. Wait a minute."), { status: 429 });
  }

  // Additional check for role hierarchy (keep existing logic)
  if (ROLE_HIERARCHY[auth.user.role as RoleName] < ROLE_HIERARCHY[ROLES.MANAGER]) {
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
        const customerIdRaw = getCellTrimmed(row, "Customer ID*");
        const dateRaw = getCellTrimmed(row, "Date*");
        const totalRaw = getCellTrimmed(row, "Total Amount*");
        const status = getCellTrimmed(row, "Status*") || "pending";
        const paymentStatus = getCellTrimmed(row, "Payment Status*") || "unpaid";
        const paymentMethod = getCellTrimmed(row, "Payment Method*");
        const shippingAddress = getCellTrimmed(row, "Shipping Address*");

        if (!customerIdRaw || !dateRaw || !totalRaw || !paymentMethod || !shippingAddress) {
          result.skipped++;
          result.errors.push({ row: rowNumber, message: "Missing required fields" });
          continue;
        }

        const customer = await prisma.customer.findFirst({
          where: { customerId: customerIdRaw, businessId, deletedAt: null },
        });
        if (!customer) {
          result.skipped++;
          result.errors.push({ row: rowNumber, message: `Customer ${customerIdRaw} not found` });
          continue;
        }

        const total = Number(totalRaw);
        const date = new Date(dateRaw);
        if (Number.isNaN(total) || Number.isNaN(date.getTime())) {
          result.skipped++;
          result.errors.push({ row: rowNumber, message: "Invalid date or amount" });
          continue;
        }

        const orderId = await generateOrderId();
        const totalDecimal = new Prisma.Decimal(total);

        await prisma.order.create({
          data: {
            businessId,
            orderId,
            customerId: customer.id,
            status,
            paymentStatus,
            paymentMethod,
            subtotal: totalDecimal,
            totalAmount: totalDecimal,
            paidAmount: paymentStatus === "paid" ? totalDecimal : new Prisma.Decimal(0),
            shippingAddress,
            createdBy: user.id,
            createdAt: date,
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