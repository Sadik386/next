import { NextRequest, NextResponse } from "next/server";
import { PERMISSIONS } from "@/constants/permissions";
import { requirePermission } from "@/lib/rbac";
import { appendScan, getBusinessIdFromPosSessionToken } from "@/services/pos.service";

async function resolveSessionBusinessId(req: NextRequest, shortId: string) {
  const tokenBusinessId = getBusinessIdFromPosSessionToken(
    shortId,
    req.nextUrl.searchParams.get("token")
  );
  if (tokenBusinessId) return tokenBusinessId;

  const auth = await requirePermission(req, PERMISSIONS.USE_POS);
  if (auth instanceof NextResponse) return auth;
  return auth.businessId;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const businessId = await resolveSessionBusinessId(req, id);
  if (businessId instanceof NextResponse) return businessId;

  let body: { barcode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const barcode = (body.barcode ?? "").toString();
  if (!barcode.trim()) {
    return NextResponse.json({ error: "Barcode is required" }, { status: 400 });
  }

  const result = await appendScan(id, barcode, businessId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
