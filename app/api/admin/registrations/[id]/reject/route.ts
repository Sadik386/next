import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePermission(req, PERMISSIONS.CREATE_USER);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;
    const { reason } = await req.json();

    if (!reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    const registration = await prisma.registrationRequest.findUnique({
      where: { id: parseInt(id) },
    });

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    if (registration.status !== "pending") {
      return NextResponse.json({ error: "Registration is not pending" }, { status: 400 });
    }

    await prisma.registrationRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: "rejected",
        rejectReason: reason,
        reviewedBy: auth.user.id,
        reviewedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: auth.user.id,
        action: "reject_registration",
        module: "users",
        entityId: String(registration.id),
        entityName: registration.name,
        description: `Rejected registration request for ${registration.email}. Reason: ${reason}`,
      },
    });

    return NextResponse.json({ success: true, message: "Registration rejected" });
  } catch (error) {
    console.error("Reject registration error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}