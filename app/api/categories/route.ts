import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getCategories, createCategory } from "@/services/category.service";
import { runWithBusinessContext, AuthenticatedUser } from "@/lib/business-context";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const user = await getAuthUser();
  if (!user || typeof user.businessId !== "number") {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  const authUser: AuthenticatedUser = {
    id: user.id,
    businessId: user.businessId,
    role: user.role || "staff",
    name: user.name || "",
    email: user.email || "",
    username: user.username,
  };

  return runWithBusinessContext(authUser, async () => {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_PRODUCT);
  if (auth instanceof NextResponse) return auth;

  return runWithBusinessContext(auth.user as AuthenticatedUser, async () => {
    try {
      const body = await req.json();
      const { name } = body;
      if (!name || typeof name !== "string") {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      const result = await createCategory(name, auth.user.id);
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ category: result.category });
    } catch (error) {
      console.error("Error creating category:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  });
}