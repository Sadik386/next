import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { runWithBusinessContext } from "@/lib/business-context";
import { holdOrder, listHeldOrders } from "@/services/pos.service";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.USE_POS);
  if (auth instanceof NextResponse) return auth;

  const items = await listHeldOrders(auth.user.id, auth.businessId);
  return NextResponse.json({
    items: items.map((h) => ({
      id: h.id,
      items: safeJson(h.items, []),
      customerData: h.customerData ? safeJson(h.customerData, null) : null,
      discount: h.discount,
      notes: h.notes,
      createdAt: h.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.USE_POS);
  if (auth instanceof NextResponse) return auth;

  const user = { ...auth.user, businessId: auth.businessId };

  return runWithBusinessContext(user, async () => {
    try {
      const body = await req.json();
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
      }
      const held = await holdOrder(
        {
          items: body.items,
          customerData: body.customerData ?? null,
          discount: Number(body.discount) || 0,
          notes: body.notes ?? null,
        },
        auth.user.id,
        auth.businessId
      );
      return NextResponse.json({ held: { id: held.id } });
    } catch (err) {
      console.error("Failed to hold order:", err);
      const message = err instanceof Error ? err.message : "Server error";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  });
}

function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
