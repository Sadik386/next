import { NextRequest, NextResponse } from "next/server";
import { forbiddenResponse, requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { ROLES, ROLE_HIERARCHY, RoleName } from "@/constants/roles";
import { prisma } from "@/lib/prisma";
import { csvResponse, CUSTOMER_COLUMNS, generateCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_CUSTOMERS);
  if (auth instanceof NextResponse) return auth;

  if (ROLE_HIERARCHY[auth.user.role as RoleName] < ROLE_HIERARCHY[ROLES.ADMIN]) {
    return forbiddenResponse();
  }

  const customers = await prisma.customer.findMany({
    where: { deletedAt: null, businessId: auth.businessId },
    orderBy: { id: "asc" },
  });

  const rows = customers.map((c) => ({
    "Full Name*": c.name,
    "Email*": c.email ?? "",
    "Phone*": c.mobile,
    Country: c.country ?? "",
    City: c.city ?? "",
    "Street Address": c.streetAddress ?? "",
    "Account Status*": c.status,
  }));

  const csv = generateCsv(rows, CUSTOMER_COLUMNS);
  return csvResponse(`customers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
