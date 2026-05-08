import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { RoleName } from "@/constants/roles";
import { getUsers, createUser } from "@/services/user.service";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.VIEW_USERS);
  if (auth instanceof NextResponse) return auth;
  const sp = req.nextUrl.searchParams;
  const result = await getUsers({
    search: sp.get("search") ?? undefined,
    role: sp.get("role") ?? undefined,
    status: sp.get("status") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_USER);
  if (auth instanceof NextResponse) return auth;
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
      auth.user.role as RoleName,
      auth.user.id
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ user: result.user });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
