import { NextRequest, NextResponse } from "next/server";
import { forbiddenResponse, requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { ROLES, ROLE_HIERARCHY, RoleName } from "@/constants/roles";
import { prisma } from "@/lib/prisma";
import { csvResponse, generateCsv, PRODUCT_COLUMNS } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_PRODUCTS);
  if (auth instanceof NextResponse) return auth;

  if (ROLE_HIERARCHY[auth.user.role as RoleName] < ROLE_HIERARCHY[ROLES.MANAGER]) {
    return forbiddenResponse();
  }

  const products = await prisma.product.findMany({
    where: { deletedAt: null, status: "active", businessId: auth.businessId },
    include: { category: true, stock: true },
    orderBy: { id: "asc" },
  });

  const rows = products.map((p) => ({
    "Product Name*": p.name,
    Description: p.description ?? "",
    Category: p.category?.name ?? "",
    SKU: p.sku ?? "",
    "Sale Price*": p.salePrice.toString(),
    "Cost Price*": p.costPrice.toString(),
    "Stock Quantity*": p.stock?.quantity ?? 0,
    "Unit*": p.unit,
    "Status*": p.status,
  }));

  const csv = generateCsv(rows, PRODUCT_COLUMNS);
  return csvResponse(`products-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
