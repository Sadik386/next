import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/rbac";
import { signToken } from "@/lib/jwt";
import { activeBusinessMemberStatusWhere } from "@/constants/business-member-status";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const targetBusinessId = Number(body.businessId);
  if (!Number.isInteger(targetBusinessId) || targetBusinessId <= 0) {
    return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });
  }

  const membership = await prisma.businessMember.findFirst({
    where: {
      userId: user.id,
      businessId: targetBusinessId,
      status: activeBusinessMemberStatusWhere(),
      business: { isActive: true },
    },
    include: { role: true },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "You do not have access to this business" },
      { status: 403 }
    );
  }

  const businessRole = membership.role.name;
  const updatedPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: businessRole,
    username: user.username,
    businessId: targetBusinessId,
    isFounder: user.isFounder,
  };

  const token = await signToken(updatedPayload);

  const response = NextResponse.json({
    success: true,
    user: {
      id: updatedPayload.id,
      name: updatedPayload.name,
      email: updatedPayload.email,
      role: updatedPayload.role,
      businessId: updatedPayload.businessId,
      isFounder: updatedPayload.isFounder,
    },
  });

  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
