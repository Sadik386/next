import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth"; // Import getAuthUser
import { getInventory, type StockStatus } from "@/services/inventory.service";
import { runWithBusinessContext } from "@/lib/business-context"; // Import the new helper
import { parseDateRangeFromSearchParams } from "@/lib/date-filter";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  // Check if user is authenticated AND has an active business context
  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  // Wrap the service call within the business context
  return runWithBusinessContext(user, async () => {
    // Now getInventory() will have the correct AsyncLocalStorage context
    const sp = req.nextUrl.searchParams;
    const statusParam = sp.get("status");
    const allowed: Array<StockStatus | "all"> = ["all", "in_stock", "low", "out_of_stock"];
    const status = statusParam && (allowed as string[]).includes(statusParam)
      ? (statusParam as StockStatus | "all")
      : undefined;
    const range = parseDateRangeFromSearchParams(sp);

    const result = await getInventory({
      search: sp.get("search") ?? undefined,
      status,
      from: range.startDate ?? undefined,
      to: range.endDate ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
      pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
    });

    return NextResponse.json(result);
  });
}
