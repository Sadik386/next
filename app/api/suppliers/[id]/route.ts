import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getSupplierByIdOrSupplierId, updateSupplier, SupplierValidationError } from "@/services/supplier.service";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const user = { ...auth.user, businessId: auth.businessId } as AuthenticatedUser;
  
  return runWithBusinessContext(user, async () => {
    const { id } = await ctx.params;
    const supplier = await getSupplierByIdOrSupplierId(id);
    if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    return NextResponse.json({ supplier });
  });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.EDIT_SUPPLIER);
  if (auth instanceof NextResponse) return auth;
  const user = { ...auth.user, businessId: auth.businessId } as AuthenticatedUser;
  
  return runWithBusinessContext(user, async () => {
    try {
      const { id } = await ctx.params;
      const supplier = await getSupplierByIdOrSupplierId(id);
      if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      
      const body = await req.json();
      const updated = await updateSupplier(supplier.id, body, auth.user.id);
      return NextResponse.json({ supplier: updated });
    } catch (error) {
      if (error instanceof SupplierValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      console.error("Error updating supplier:", error);
      const message =
        error instanceof Error && process.env.NODE_ENV !== "production"
          ? error.message
          : "Failed to update supplier";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
