import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getBusinessSubscriptionRequests, createSubscriptionRequest } from "@/services/subscription-request.service";

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

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user || !user.businessId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, subject, message, requestedPlan } = body;

    if (!type) {
      return NextResponse.json({ success: false, message: "Request type is required" }, { status: 400 });
    }

    const validTypes = ["support", "billing", "upgrade", "contact_sales"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, message: "Invalid request type" }, { status: 400 });
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ success: false, message: "Message is required" }, { status: 400 });
    }

    const result = await createSubscriptionRequest({
      businessId: user.businessId,
      userId: user.id,
      type: type as any,
      requestedPlan: requestedPlan || undefined,
      reason: subject || undefined,
      message: message.trim(),
    });

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: "Support request created successfully"
    });
  } catch (error: any) {
    console.error("Error creating support request:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to create request" }, { status: 500 });
  }
}