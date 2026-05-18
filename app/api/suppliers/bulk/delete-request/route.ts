import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { requestDeleteSupplier } from "@/services/supplier.service";
import { runWithBusinessContext } from "@/lib/business-context";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.BULK_CREATE_DELETE_REQUEST);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext({ ...auth.user, businessId: auth.businessId }, async () => {
    const { ids, reason } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }
    if (!reason?.trim()) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const id of ids) {
      const supplierId = Number(id);
      if (!Number.isInteger(supplierId) || supplierId <= 0) {
        errors.push({ id, error: "Invalid supplier ID" });
        continue;
      }

      try {
        const result = await requestDeleteSupplier(supplierId, reason.trim(), auth.user.id);
        if (result) {
          results.push({ id, success: true });
        } else {
          errors.push({ id, error: "Supplier not found" });
        }
      } catch (err) {
        console.error(`Error requesting delete for supplier ID ${id}:`, err);
        errors.push({
          id,
          error:
            err instanceof Error && process.env.NODE_ENV !== "production"
              ? err.message
              : "Failed to process request",
        });
      }
    }

    return NextResponse.json({
      created: results.length,
      failed: errors.length,
      details: { results, errors },
    });
  });
}
