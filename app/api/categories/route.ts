import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { getCategories, createCategory } from "@/services/category.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const categories = await getCategories();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.CREATE_PRODUCT);
  if (auth instanceof NextResponse) return auth;
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const result = await createCategory(name, auth.user.id);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ category: result.category });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
