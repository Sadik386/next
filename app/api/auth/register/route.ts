import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { checkRateLimit, getRateLimitResponse } from "@/lib/rate-limit";
import { getRequestInfo } from "@/lib/request-info";

export async function POST(req: NextRequest) {
  const { ip } = getRequestInfo(req);
  if (!checkRateLimit(ip, { windowMs: 60 * 60 * 1000, maxRequests: 5 })) {
    return NextResponse.json(getRateLimitResponse("Too many registration attempts. Try again in an hour."), { status: 429 });
  }
  try {
    const { name, username, email, phone, password, gender, dob, address } = await req.json();

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "All required fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const existingUsername = await prisma.user.findFirst({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    const existingRequest = await prisma.registrationRequest.findUnique({ where: { email } });
    if (existingRequest) {
      return NextResponse.json({ error: "A registration request with this email already exists" }, { status: 400 });
    }

    const existingRequestUsername = await prisma.registrationRequest.findFirst({ where: { username } });
    if (existingRequestUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.registrationRequest.create({
      data: {
        name,
        username,
        email,
        phone: phone || null,
        password: hashedPassword,
        gender: gender || null,
        dob: dob ? new Date(dob) : null,
        address: address || null,
        status: "pending",
      },
    });

    const adminUsers = await prisma.user.findMany({
      where: {
        role: { name: { in: ["super_admin", "admin"] } },
        isActive: true,
        businessMemberships: {
          some: { status: "active", business: { isActive: true } },
        },
      },
      select: {
        id: true,
        businessMemberships: {
          where: { status: "active", business: { isActive: true } },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
          take: 1,
          select: { businessId: true },
        },
      },
    });

    const notifications = adminUsers.flatMap((admin) => {
      const businessId = admin.businessMemberships[0]?.businessId;
      if (!businessId) return [];
      return [{
        businessId,
        userId: admin.id,
        type: "registration",
        title: "New Registration Request",
        message: `New registration request from ${name} (${email})`,
        link: "/system/registrations",
      }];
    });

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return NextResponse.json({ success: true, message: "Registration submitted for approval" });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
