import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-auth";
import { getPlatformSubscriptionRequests } from "@/services/subscription-request.service";

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const statusFilter = status ? status.split(",") as any[] : undefined;
    const typeFilter = type ? type.split(",") as any[] : undefined;

    const result = await getPlatformSubscriptionRequests({
      status: statusFilter,
      type: typeFilter,
      search,
      limit,
      offset,
    });

    return NextResponse.json({ 
      success: true, 
      data: result.items,
      total: result.total,
      pagination: { limit, offset }
    });
  } catch (error: any) {
    console.error("Error fetching platform support requests:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}