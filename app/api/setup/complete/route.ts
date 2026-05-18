import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signToken } from "@/lib/jwt";
import { getAppRuntimeConfig } from "@/lib/config/app-mode";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toBusinessSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "business";
}

function setupError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, message, error: message },
    { status }
  );
}

export async function POST(req: NextRequest) {
  try {
    const runtime = getAppRuntimeConfig();
    const body = await req.json();
    const { businessName, email, password, confirmPassword, name } = body;

    // Validation
    if (!businessName?.trim()) {
      return setupError("Business name is required");
    }
    if (!name?.trim()) {
      return setupError("Full name is required");
    }
    if (!email?.trim()) {
      return setupError("Email is required");
    }
    if (!isValidEmail(email)) {
      return setupError("Invalid email format");
    }
    if (!password) {
      return setupError("Password is required");
    }
    if (password.length < 8) {
      return setupError("Password must be at least 8 characters");
    }
    if (password !== confirmPassword) {
      return setupError("Passwords do not match");
    }

    // Check if setup already complete
    const existingSettings = await prisma.setting.findFirst();
    if (existingSettings?.isSetupComplete) {
      return setupError("Setup already complete");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return setupError("Email already in use");
    }

    // Get super admin role
    const superAdminRole = await prisma.role.findUnique({ where: { name: "super_admin" } });
    if (!superAdminRole) {
      return setupError("Super Admin role not found. Run seed first.", 500);
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const username = email.split("@")[0];
    const cleanBusinessName = businessName.trim();
    const business = await prisma.business.upsert({
      where: { slug: toBusinessSlug(cleanBusinessName) },
      update: { name: cleanBusinessName, isActive: true },
      create: {
        name: cleanBusinessName,
        slug: toBusinessSlug(cleanBusinessName),
        isActive: true,
      },
    });

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        username,
        password: hashedPassword,
        roleId: superAdminRole.id,
        isActive: true,
        isFounder: true,
      },
    });

    // Create or update settings
    await prisma.setting.upsert({
      where: { id: existingSettings?.id ?? 1 },
      update: {
        businessId: business.id,
        businessName: cleanBusinessName,
        isSetupComplete: true,
      },
      create: {
        businessId: business.id,
        businessName: cleanBusinessName,
        isSetupComplete: true,
        currency: "BDT",
        brandColor: "#C4973A",
        weekStartDay: 0,
      },
    });

    await prisma.businessMember.upsert({
      where: {
        userId_businessId: {
          userId: user.id,
          businessId: business.id,
        },
      },
      update: { isDefault: true, status: "active" },
      create: {
        userId: user.id,
        businessId: business.id,
        isDefault: true,
        status: "active",
      },
    });

    // Generate token for auto-login
    const token = await signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: "super_admin",
      username,
      businessId: business.id,
    });

    const responseData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "super_admin",
        businessId: business.id,
      },
      runtime,
    };

    const response = NextResponse.json({
      success: true,
      message: "Setup complete",
      data: responseData,
      ...responseData,
    });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Setup error:", err);
    return setupError("Server error", 500);
  }
}
