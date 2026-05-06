import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getInventory, type StockStatus } from "@/services/inventory.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const sp = req.nextUrl.searchParams;
  const statusParam = sp.get("status");
  const allowed: Array<StockStatus | "all"> = ["all", "in_stock", "low", "out_of_stock"];
  const status = statusParam && (allowed as string[]).includes(statusParam)
    ? (statusParam as StockStatus | "all")
    : undefined;

  const result = await getInventory({
    search: sp.get("search") ?? undefined,
    status,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });

  return NextResponse.json(result);
}
