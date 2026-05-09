import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, PERMISSIONS.VIEW_USERS);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") {
      where.status = status;
    }

    const registrations = await prisma.registrationRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const pendingCount = await prisma.registrationRequest.count({
      where: { status: "pending" },
    });

    return NextResponse.json({ registrations, pendingCount });
  } catch (error) {
    console.error("Get registrations error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}