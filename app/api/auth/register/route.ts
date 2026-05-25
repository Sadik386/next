import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { checkRateLimit, getRateLimitResponse } from "@/lib/rate-limit";
import { getRequestInfo } from "@/lib/request-info";
import { BUSINESS_MEMBER_STATUS } from "@/constants/business-member-status";
import { ROLES } from "@/constants/roles";
import { PLAN_NAMES } from "@/lib/pricing";
import { createEmailVerificationToken, sendVerificationEmail } from "@/services/email-verification.service";
import { verifyTurnstileToken } from "@/services/turnstile.service";

function toBusinessSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  const { ip } = getRequestInfo(req);
  if (!checkRateLimit(ip, { windowMs: 60 * 60 * 1000, maxRequests: 5 })) {
    return NextResponse.json(getRateLimitResponse("Too many registration attempts. Try again in an hour."), { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const turnstileToken = body.turnstileToken as string | undefined;
  if (!turnstileToken) {
    return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 400 });
  }
  const turnstileResult = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResult.success) {
    return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 400 });
  }

  try {
    const {
      name,
      username,
      email,
      phone,
      password,
      gender,
      dob,
      address,
      businessName,
      businessUsername,
      country,
      currency,
    } = body as {
      name: string;
      username: string;
      email: string;
      phone: string;
      password: string;
      gender: string;
      dob: string;
      address: string;
      businessName: string;
      businessUsername: string;
      country: string;
      currency: string;
    };

    if (!name || !username || !email || !password || !businessName || !businessUsername) {
      return NextResponse.json({ error: "All required fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (!/^[a-z0-9-]+$/.test(businessUsername)) {
      return NextResponse.json({ error: "Business username can only contain lowercase letters, numbers, and hyphens" }, { status: 400 });
    }

    if (businessUsername.length < 3) {
      return NextResponse.json({ error: "Business username must be at least 3 characters" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const existingUsername = await prisma.user.findFirst({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    const existingBusinessSlug = await prisma.business.findUnique({
      where: { slug: businessUsername },
    });
    if (existingBusinessSlug) {
      return NextResponse.json({ error: "Business username already taken" }, { status: 400 });
    }

    const adminRole = await prisma.role.findUnique({
      where: { name: ROLES.SUPER_ADMIN },
    });
    if (!adminRole) {
      return NextResponse.json({ error: "Role not found. Please contact support." }, { status: 500 });
    }

    const freePlan = await prisma.subscriptionPlan.findUnique({
      where: { name: PLAN_NAMES.FREE },
    });
    if (!freePlan) {
      return NextResponse.json({ error: "Free plan not found. Please contact support." }, { status: 500 });
    }

    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          username,
          email,
          phone: phone || null,
          password: hashedPassword,
          roleId: adminRole.id,
          gender: gender || null,
          dob: dob ? new Date(dob) : null,
          address: address || null,
          isActive: true,
        },
      });

      const business = await tx.business.create({
        data: {
          name: businessName,
          slug: businessUsername,
          isActive: true,
        },
      });

      await tx.businessMember.create({
        data: {
          userId: user.id,
          businessId: business.id,
          isDefault: true,
          status: BUSINESS_MEMBER_STATUS.ACTIVE,
        },
      });

      const validCountry = typeof country === "string" && country.trim().length > 0 ? country.trim() : null;
      const validCurrency = typeof currency === "string" && currency.trim().length > 0 ? currency.trim() : null;

      await tx.setting.create({
        data: {
          businessId: business.id,
          businessName: businessName,
          country: validCountry,
          currency: validCurrency ?? "BDT",
        },
      });

      const now = new Date();
      const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await tx.subscription.upsert({
        where: { businessId: business.id },
        update: {
          planId: freePlan.id,
          status: "active",
          billingCycle: "monthly",
          currentPeriodStart: now,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          pausedAt: null,
        },
        create: {
          businessId: business.id,
          planId: freePlan.id,
          status: "active",
          billingCycle: "monthly",
          currentPeriodStart: now,
          currentPeriodEnd,
        },
      });

      return { user, business };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const tokenResult = await createEmailVerificationToken(result.user.id, result.user.email);

    if (tokenResult.success && tokenResult.token) {
      await sendVerificationEmail(
        result.user.email,
        result.user.name,
        businessName,
        tokenResult.token,
        baseUrl
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account and business workspace created. Please verify your email.",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      business: {
        id: result.business.id,
        name: result.business.name,
        slug: result.business.slug,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}