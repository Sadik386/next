import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { getProducts, createProduct } from "@/services/product.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { hasPermission } from "@/lib/rbac";
import { RoleName } from "@/constants/roles";
import { parseDateRangeFromSearchParams } from "@/lib/date-filter";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  // Check if user is authenticated AND has an active business context
  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    const sp = req.nextUrl.searchParams;
    const range = parseDateRangeFromSearchParams(sp);
    const result = await getProducts({
      search: sp.get("search") ?? undefined,
      categoryId: sp.get("categoryId") ? Number(sp.get("categoryId")) : undefined,
      status: sp.get("status") ?? undefined,
      from: range.startDate ?? undefined,
      to: range.endDate ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });
    return NextResponse.json(result);
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.CREATE_PRODUCT)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    try {
      const body = await req.json();
      if (!body.name || !body.unit || body.salePrice == null || body.costPrice == null) {
        return NextResponse.json(
          { error: "Name, unit, salePrice and costPrice are required" },
          { status: 400 }
        );
      }
      const product = await createProduct(body, user.id);
      return NextResponse.json({ product });
    } catch (error) {
      console.error("Error creating product:", error);
      const message =
        error instanceof Error && process.env.NODE_ENV !== "production"
          ? error.message
          : "Failed to create product";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
