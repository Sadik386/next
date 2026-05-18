import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { addRequestNote } from "@/services/subscription-request.service";

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
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to add note" }, { status: 500 });
  }
}
