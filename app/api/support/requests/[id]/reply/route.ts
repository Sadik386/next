import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { addRequestNote, getSubscriptionRequestById } from "@/services/subscription-request.service";
import { sendSupportReplyEmail, isPlatformEmailConfigured } from "@/services/platform-email.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || !user.businessId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { note } = await req.json();
    const requestId = parseInt(id, 10);

    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
    }

    if (typeof note !== "string" || note.trim().length === 0) {
      return NextResponse.json({ success: false, message: "Reply note is required" }, { status: 400 });
    }

    const requestData = await getSubscriptionRequestById(requestId);
    if (!requestData || requestData.businessId !== user.businessId) {
      return NextResponse.json({ success: false, message: "Request not found" }, { status: 404 });
    }

    const safeNote = note.trim();
    await addRequestNote({
      requestId,
      note: safeNote,
      userId: user.id,
      visibility: "public",
    });

    if (requestData && requestData.user?.email) {
      const canSendEmail = await isPlatformEmailConfigured();
      if (canSendEmail) {
        try {
          await sendSupportReplyEmail(
            requestData.user.email,
            `Support Request #${id}`,
            safeNote,
            requestData.business?.name
          );
        } catch {
          console.error("Failed to send support reply email.");
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to add note" }, { status: 500 });
  }
}
