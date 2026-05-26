import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { RoleName } from "@/constants/roles";
import { getUsers, createUser } from "@/services/user.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { hasPermission } from "@/lib/rbac";
import { createEmailVerificationToken, sendVerificationEmail } from "@/services/email-verification.service";
import { prisma } from "@/lib/prisma";
import { guardReadOnlyWrite, SubscriptionGuardError } from "@/lib/subscription-guard";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.VIEW_USERS)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    const sp = req.nextUrl.searchParams;
    const result = await getUsers({
      search: sp.get("search") ?? undefined,
      role: sp.get("role") ?? undefined,
      status: sp.get("status") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      limit: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });
    return NextResponse.json(result);
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  if (!user.role || !hasPermission(user.role as RoleName, PERMISSIONS.CREATE_USER)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    try {
      try {
        await guardReadOnlyWrite(user.businessId!);
      } catch (guardErr) {
        if (guardErr instanceof SubscriptionGuardError) {
          return NextResponse.json({ error: guardErr.message, code: guardErr.code }, { status: guardErr.status });
        }
        throw guardErr;
      }
      const body = await req.json();
      const name = (body.name ?? "").trim();
      const email = (body.email ?? "").trim().toLowerCase();
      const password = body.password ?? "";
      const roleName = body.roleName as RoleName;

      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
      if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
      if (!roleName) return NextResponse.json({ error: "Role is required" }, { status: 400 });
      if (!password || password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const result = await createUser(
        { name, email, password, roleName },
        { id: user.id, role: user.role as RoleName, businessId: user.businessId }
      );
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
      }

      const business = await prisma.business.findUnique({
        where: { id: user.businessId },
        select: { name: true },
      });

      const tokenResult = await createEmailVerificationToken(result.user.id, email, user.businessId);
      if (tokenResult.success && tokenResult.token) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await sendVerificationEmail(email, name, business?.name || "Accoraze", tokenResult.token, baseUrl);
      }

      return NextResponse.json({ user: result.user }, { status: 201 });
    } catch (error) {
      console.error("Error creating user:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  });
}
