import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { getCustomers, createCustomer } from "@/services/customer.service";
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

  return runWithBusinessContext(user, async () => {
    const sp = req.nextUrl.searchParams;
    const range = parseDateRangeFromSearchParams(sp);
    const result = await getCustomers({
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

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.CREATE_CUSTOMER)) {
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
      if (!body.name || !body.mobile) {
        return NextResponse.json(
          { error: "Name and mobile are required" },
          { status: 400 }
        );
      }
      const customer = await createCustomer(body, user.id);
      return NextResponse.json({ customer });
    } catch (error) {
      console.error("Error creating customer:", error);
      const message =
        error instanceof Error && process.env.NODE_ENV !== "production"
          ? error.message
          : "Failed to create customer";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
