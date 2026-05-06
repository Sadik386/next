import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getProducts, createProduct } from "@/services/product.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const sp = req.nextUrl.searchParams;
  const result = await getProducts({
    search: sp.get("search") ?? undefined,
    categoryId: sp.get("categoryId") ? Number(sp.get("categoryId")) : undefined,
    status: sp.get("status") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_PRODUCT);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    if (!body.name || !body.unit || body.salePrice == null || body.costPrice == null) {
      return NextResponse.json(
        { error: "Name, unit, salePrice and costPrice are required" },
        { status: 400 }
      );
    }
    const product = await createProduct(body, auth.user.id);
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
