import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { RoleName } from "@/constants/roles";
import { inviteUser } from "@/services/user.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { hasPermission } from "@/lib/rbac";
import { createInviteToken, sendInviteEmail } from "@/services/invite-email.service";
import { prisma } from "@/lib/prisma";
import { guardReadOnlyWrite, SubscriptionGuardError } from "@/lib/subscription-guard";

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
      const email = (body.email ?? "").trim().toLowerCase();
      const roleName = body.roleName as RoleName;

      if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
      if (!roleName) return NextResponse.json({ error: "Role is required" }, { status: 400 });

      const result = await inviteUser(
        { email, roleName },
        { id: user.id, role: user.role as RoleName, businessId: user.businessId }
      );
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
      }

      const business = await prisma.business.findUnique({
        where: { id: user.businessId },
        select: { name: true },
      });

      const tokenResult = await createInviteToken(result.user.id, user.businessId);
      if (tokenResult.success && tokenResult.token) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await sendInviteEmail(
          email,
          result.user.name,
          user.name || "A user",
          business?.name || "NextGen Cloud POS",
          result.user.role.label,
          tokenResult.token,
          baseUrl
        );
      }

      return NextResponse.json({ user: result.user }, { status: 201 });
    } catch (error) {
      console.error("Error inviting user:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  });
}
