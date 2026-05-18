import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { forbiddenResponse, requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { ROLES, ROLE_HIERARCHY, RoleName } from "@/constants/roles";
import { prisma } from "@/lib/prisma";
import { generateProductId } from "@/services/product.service";
import { getCellTrimmed, ImportResult, parseCsv } from "@/lib/csv";
import { checkRateLimit, getRateLimitResponse } from "@/lib/rate-limit";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_PRODUCT);
  if (auth instanceof NextResponse) return auth;

  if (!checkRateLimit(`import:${auth.businessId}`, { windowMs: 60 * 1000, maxRequests: 3 })) {
    return NextResponse.json(getRateLimitResponse("Too many import requests. Wait a minute."), { status: 429 });
  }

  if (ROLE_HIERARCHY[auth.user.role as RoleName] < ROLE_HIERARCHY[ROLES.ADMIN]) {
    return forbiddenResponse();
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

    const categoryCache = new Map<string, number>();
    async function getOrCreateCategory(name: string): Promise<number | null> {
      const key = name.toLowerCase();
      if (categoryCache.has(key)) return categoryCache.get(key)!;
      const existing = await prisma.category.findFirst({
        where: { businessId, name },
      });
      if (existing) {
        categoryCache.set(key, existing.id);
        return existing.id;
      }
      const created = await prisma.category.create({ data: { businessId, name } });
      categoryCache.set(key, created.id);
      return created.id;
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;
      try {
        const name = getCellTrimmed(row, "Product Name*");
        const salePriceRaw = getCellTrimmed(row, "Sale Price*");
        const costPriceRaw = getCellTrimmed(row, "Cost Price*");
        const stockQtyRaw = getCellTrimmed(row, "Stock Quantity*");
        const unit = getCellTrimmed(row, "Unit*");
        const status = getCellTrimmed(row, "Status*") || "active";

        if (!name || !salePriceRaw || !costPriceRaw || !stockQtyRaw || !unit) {
          result.skipped++;
          result.errors.push({ row: rowNumber, message: "Missing required fields" });
          continue;
        }

        const salePrice = Number(salePriceRaw);
        const costPrice = Number(costPriceRaw);
        const stockQty = Math.max(0, Math.floor(Number(stockQtyRaw)));
        if (Number.isNaN(salePrice) || Number.isNaN(costPrice) || Number.isNaN(stockQty)) {
          result.skipped++;
          result.errors.push({ row: rowNumber, message: "Invalid numeric values" });
          continue;
        }

        const description = getCellTrimmed(row, "Description") || null;
        const sku = getCellTrimmed(row, "SKU") || null;
        const categoryName = getCellTrimmed(row, "Category");
        const categoryId = categoryName ? await getOrCreateCategory(categoryName) : null;

        const productId = await generateProductId();
        const product = await prisma.product.create({
          data: {
            businessId,
            productId,
            name,
            sku,
            categoryId,
            unit,
            salePrice: new Prisma.Decimal(salePrice),
            costPrice: new Prisma.Decimal(costPrice),
            description,
            status,
          },
        });

        await prisma.stock.create({
          data: { businessId, productId: product.id, quantity: stockQty, threshold: 10 },
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
  });
}
