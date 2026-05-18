import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { PERMISSIONS } from "@/constants/permissions";
import { RoleName } from "@/constants/roles";
import { getUsers, createUser } from "@/services/user.service";
import { runWithBusinessContext } from "@/lib/business-context";
import { hasPermission } from "@/lib/rbac";

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
        user.role as RoleName,
        user.id,
        user.businessId
      );
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ user: (result as any).user });
    } catch (error) {
      console.error("Error creating user:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  });
}
