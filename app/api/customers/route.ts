import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getCustomers, createCustomer } from "@/services/customer.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const sp = req.nextUrl.searchParams;
  const result = await getCustomers({
    search: sp.get("search") ?? undefined,
    status: sp.get("status") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_CUSTOMER);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    if (!body.name || !body.mobile) {
      return NextResponse.json(
        { error: "Name and mobile are required" },
        { status: 400 }
      );
    }
    const customer = await createCustomer(body, auth.user.id);
    return NextResponse.json({ customer });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
