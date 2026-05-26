import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { getSuppliers, createSupplier, SupplierValidationError } from "@/services/supplier.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { hasPermission } from "@/lib/rbac";
import { RoleName } from "@/constants/roles";
import { parseDateRangeFromSearchParams } from "@/lib/date-filter";
import { guardReadOnlyWrite, SubscriptionGuardError } from "@/lib/subscription-guard";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.VIEW_SUPPLIERS)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    const sp = req.nextUrl.searchParams;
    const range = parseDateRangeFromSearchParams(sp);
    const result = await getSuppliers({
      search: sp.get("search") ?? undefined,
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

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.CREATE_SUPPLIER)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    try {
      try {
        await guardReadOnlyWrite(user.businessId!);
      } catch (guardErr) {
        if (guardErr instanceof SubscriptionGuardError) {
          return NextResponse.json({ error: guardErr.message, code: guardErr.code }, { status: guardErr.status });
        }
        throw guardErr;
      }
      const body = await req.json();
      const supplier = await createSupplier(body, user.id);
      return NextResponse.json({ supplier });
    } catch (error) {
      if (error instanceof SupplierValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      console.error("Error creating supplier:", error);
      const message =
        error instanceof Error && process.env.NODE_ENV !== "production"
          ? error.message
          : "Failed to create supplier";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
