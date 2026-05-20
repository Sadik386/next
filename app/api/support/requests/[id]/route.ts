import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSubscriptionRequestById } from "@/services/subscription-request.service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.businessId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const request = await getSubscriptionRequestById(parseInt(id));
    if (!request || request.businessId !== user.businessId) {
      return NextResponse.json({ success: false, message: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ 
      success: true, 
      data: request,
      currentUserId: user.id,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch request" }, { status: 500 });
  }
}
