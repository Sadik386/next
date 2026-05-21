import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { approveRegistrationRequest } from "@/services/user.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePermission(req, PERMISSIONS.CREATE_USER);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;

    const result = await approveRegistrationRequest(Number(id), {
      id: auth.user.id,
      role: auth.user.role,
      businessId: auth.businessId,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Registration approved and user created",
      user: result.user,
    });
  } catch (error) {
    console.error("Approve registration error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
