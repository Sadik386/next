import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUSINESS_MEMBER_STATUS } from "@/constants/business-member-status";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to accept this invitation." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = body.token as string;
  if (!token) {
    return NextResponse.json({ error: "Invitation token is required" }, { status: 400 });
  }

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: {
      user: true,
    },
  });

  if (!verificationToken) {
    return NextResponse.json({ error: "Invalid invitation link. Please request a new invitation." }, { status: 400 });
  }

  if (verificationToken.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });
    return NextResponse.json({ error: "This invitation has expired. Please request a new one." }, { status: 400 });
  }

  if (verificationToken.userId !== user.id) {
    return NextResponse.json({ error: "This invitation belongs to another user. Please sign in with the correct account." }, { status: 403 });
  }

  const businessId = verificationToken.businessId;
  if (!businessId) {
    await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });
    return NextResponse.json({ error: "Invalid invitation. Business not found." }, { status: 400 });
  }

  const membership = await prisma.businessMember.findFirst({
    where: {
      userId: user.id,
      businessId,
      status: BUSINESS_MEMBER_STATUS.PENDING,
    },
    include: {
      role: true,
      business: true,
    },
  });

  if (!membership) {
    await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });
    return NextResponse.json({ error: "No pending invitation found for this business." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.businessMember.update({
      where: { id: membership.id },
      data: { status: BUSINESS_MEMBER_STATUS.ACTIVE },
    });
    await tx.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });
  });

  return NextResponse.json({ success: true, message: `You now have access to ${membership.business.name}.` });
}