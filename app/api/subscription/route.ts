import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { runWithBusinessContext } from "@/lib/business-context";
import { getSubscriptionDashboardData } from "@/services/subscription.service";

export async function GET() {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return runWithBusinessContext(user, async () => {
    try {
      const data = await getSubscriptionDashboardData(user.businessId!);
      return NextResponse.json({ data });
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  });
}
