import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/rbac";
import { activeBusinessMemberStatusWhere } from "@/constants/business-member-status";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.business.findMany({
    where: {
      isActive: true,
      members: {
        some: {
          userId: user.id,
          status: activeBusinessMemberStatusWhere(),
        },
      },
    },
    include: {
      members: {
        where: {
          userId: user.id,
          status: activeBusinessMemberStatusWhere(),
        },
        select: { isDefault: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!memberships.length) {
    return NextResponse.json({ businesses: [], activeBusinessId: null });
  }

  const businesses = memberships.map((b) => ({
    businessId: b.id,
    name: b.name,
    slug: b.slug,
    isDefault: b.members[0]?.isDefault ?? false,
  }));

  const activeBusinessId = user.businessId ?? businesses.find((b) => b.isDefault)?.businessId ?? businesses[0].businessId;

  return NextResponse.json({ businesses, activeBusinessId });
}
