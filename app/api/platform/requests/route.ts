import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getPlatformSubscriptionRequests, SubscriptionRequestStatus, SubscriptionRequestType } from "@/services/subscription-request.service";

export async function GET(request: Request) {
  const user = await getAuthUser();

  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.getAll("status") as SubscriptionRequestStatus[];
  const type = searchParams.getAll("type") as SubscriptionRequestType[];
  const search = searchParams.get("search") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const data = await getPlatformSubscriptionRequests({
      status: status.length > 0 ? status : undefined,
      type: type.length > 0 ? type : undefined,
      search,
      limit,
      offset,
    });
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error fetching platform subscription requests:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
