import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-auth";
import { getSubscriptionRequestById, updateSubscriptionRequestStatus, addRequestNote } from "@/services/subscription-request.service";
import { sendSupportReplyEmail, isPlatformEmailConfigured } from "@/services/platform-email.service";

async function sendReplyEmail(requestId: number, note: string, requestData: any) {
  const canSendEmail = isPlatformEmailConfigured();
  if (!canSendEmail) return;

  if (requestData?.user?.email) {
    try {
      await sendSupportReplyEmail(
        requestData.user.email,
        `Support Request #${requestId}`,
        note,
        requestData.business?.name
      );
    } catch (emailError) {
      console.error("Failed to send support reply email:", emailError);
    }
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const request = await getSubscriptionRequestById(parseInt(id));
    
    if (!request) {
      return NextResponse.json({ success: false, message: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: request, adminUserId: auth.user.id });
  } catch (error: any) {
    console.error("Error fetching support request:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlatformAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, adminNote, visibility, userId } = body;

    if (!status) {
      return NextResponse.json({ success: false, message: "Status is required" }, { status: 400 });
    }

    const validStatuses = ["pending", "in_review", "contacted", "approved", "rejected", "resolved"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    const requestData = await getSubscriptionRequestById(parseInt(id));

    const updated = await updateSubscriptionRequestStatus({
      id: parseInt(id),
      status,
      adminNote,
      visibility,
      userId: userId || auth.user.id,
    });

    if (visibility === "public" && adminNote) {
      await sendReplyEmail(parseInt(id), adminNote, requestData);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating support request:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}