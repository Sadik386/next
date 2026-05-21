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

    await addRequestNote({
      requestId: parseInt(id),
      note,
      userId: user.id,
      visibility: "public",
    });

    const requestData = await getSubscriptionRequestById(parseInt(id));
    if (requestData && requestData.user?.email) {
      const canSendEmail = await isPlatformEmailConfigured();
      if (canSendEmail) {
        try {
          await sendSupportReplyEmail(
            requestData.user.email,
            `Support Request #${id}`,
            note,
            requestData.business?.name
          );
        } catch (emailError) {
          console.error("Failed to send support reply email:", emailError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to add note" }, { status: 500 });
  }
}
