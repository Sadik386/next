import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { BUSINESS_MEMBER_STATUS } from "@/constants/business-member-status";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePermission(req, PERMISSIONS.CREATE_USER);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;

    const registration = await prisma.registrationRequest.findUnique({
      where: { id: parseInt(id) },
    });

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    if (registration.status !== "pending") {
      return NextResponse.json({ error: "Registration is not pending" }, { status: 400 });
    }

    const defaultRole = await prisma.role.findFirst({
      where: { name: "Staff" },
    });

    if (!defaultRole) {
      return NextResponse.json({ error: "Default role not found" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name: registration.name,
        username: registration.username,
        email: registration.email,
        phone: registration.phone,
        password: registration.password,
        roleId: defaultRole.id,
        gender: registration.gender,
        dob: registration.dob,
        address: registration.address,
        isActive: true,
      },
    });

    await prisma.businessMember.create({
      data: {
        userId: user.id,
        businessId: auth.businessId,
        isDefault: true,
        status: BUSINESS_MEMBER_STATUS.ACTIVE,
      },
    });

    await prisma.registrationRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: "approved",
        reviewedBy: auth.user.id,
        reviewedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        businessId: auth.businessId,
        userId: auth.user.id,
        action: "approve_registration",
        module: "users",
        entityId: String(user.id),
        entityName: registration.name,
        description: `Approved registration request for ${registration.email} and created user account`,
      },
    });

    return NextResponse.json({ success: true, message: "Registration approved and user created" });
  } catch (error) {
    console.error("Approve registration error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
