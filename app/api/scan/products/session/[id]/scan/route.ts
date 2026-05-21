import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import {
  getBusinessIdFromProductScanSessionToken,
  submitProductScan,
} from "@/services/scanner.service";
import { findProductByFlexibleCode } from "@/services/product.service";

async function resolveSessionBusinessId(req: NextRequest, sessionId: string) {
  const tokenBusinessId = getBusinessIdFromProductScanSessionToken(
    sessionId,
    req.nextUrl.searchParams.get("token")
  );
  if (tokenBusinessId) return tokenBusinessId;

  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  return auth.businessId;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const businessId = await resolveSessionBusinessId(req, id);
  if (businessId instanceof NextResponse) return businessId;

  let body: { code?: unknown; barcode?: unknown; sku?: unknown; productId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const code = (body.code ?? body.barcode ?? body.sku ?? body.productId ?? "")
    .toString()
    .trim();
  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const product = await findProductByFlexibleCode(code, businessId);
  const result = submitProductScan(
    id,
    code,
    businessId,
    product
      ? {
          id: product.id,
          productId: product.productId,
          name: product.name,
          sku: product.sku,
        }
      : null
  );
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    success: true,
    code,
    productName: product?.name ?? null,
  });
}
