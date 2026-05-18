import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { runWithBusinessContext } from "@/lib/business-context";
import { globalSearch } from "@/services/search.service";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied: Business context required." }, { status: 403 });
  }

  const query = req.nextUrl.searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return NextResponse.json({ results: {} });
  }

  return runWithBusinessContext(user, async () => {
    try {
      const results = await globalSearch(query);
      return NextResponse.json({ results });
    } catch (error) {
      console.error("Global search error:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
  });
}