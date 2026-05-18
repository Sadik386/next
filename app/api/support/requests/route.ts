import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getBusinessSubscriptionRequests } from "@/services/subscription-request.service";

export async function GET() {
  const user = await getAuthUser();
  if (!user || !user.businessId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await getBusinessSubscriptionRequests(user.businessId);
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch requests" }, { status: 500 });
  }
}