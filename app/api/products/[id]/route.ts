import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getProductById, updateProduct } from "@/services/product.service";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const product = await getProductById(Number(id));
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.EDIT_PRODUCT);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const product = await updateProduct(Number(id), body, auth.user.id);
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
