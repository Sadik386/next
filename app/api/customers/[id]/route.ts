import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getCustomerByIdOrCustomerId, updateCustomer } from "@/services/customer.service";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";
import { guardReadOnlyWrite, SubscriptionGuardError } from "@/lib/subscription-guard";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!auth.businessId) {
    return NextResponse.json({ error: "Business context required" }, { status: 403 });
  }

  const user = { ...auth.user, businessId: auth.businessId } as AuthenticatedUser;
  const { id } = await ctx.params;

  return runWithBusinessContext(user, async () => {
    const customer = await getCustomerByIdOrCustomerId(id);
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ customer });
  });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(req, PERMISSIONS.EDIT_CUSTOMER);
  if (auth instanceof NextResponse) return auth;

  const user = { ...auth.user, businessId: auth.businessId } as AuthenticatedUser;
  const { id } = await ctx.params;

  return runWithBusinessContext(user, async () => {
    try {
      try {
        await guardReadOnlyWrite(auth.businessId);
      } catch (guardErr) {
        if (guardErr instanceof SubscriptionGuardError) {
          return NextResponse.json({ error: guardErr.message, code: guardErr.code }, { status: guardErr.status });
        }
        throw guardErr;
      }
      const customer = await getCustomerByIdOrCustomerId(id);
      if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

      const body = await req.json();
      const updated = await updateCustomer(customer.id, body, auth.user.id);
      return NextResponse.json({ customer: updated });
    } catch (err) {
      console.error("Customer update error:", err);
      const message = err instanceof Error ? err.message : "Failed to update customer";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
