import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { runWithBusinessContext } from "@/lib/business-context";
import { createSubscriptionRequest } from "@/services/subscription-request.service";

export async function POST(request: Request) {
  const user = await getAuthUser();

  if (!user || !user.businessId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, requestedPlan, reason, message } = body;

    if (!type || !["upgrade", "contact_sales"].includes(type)) {
      return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
    }

    return await runWithBusinessContext(user, async () => {
      const result = await createSubscriptionRequest({
        businessId: user.businessId!,
        userId: user.id,
        type,
        requestedPlan,
        reason,
        message,
      });

      return NextResponse.json({ 
        success: true, 
        data: result,
        message: type === "upgrade" ? "Upgrade request submitted" : "Contact request submitted"
      });
    });
  } catch (error: any) {
    console.error("Error creating subscription request:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
