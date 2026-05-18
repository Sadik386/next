import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { updateSubscriptionRequestStatus, SubscriptionRequestStatus, getSubscriptionRequestById, addRequestNote } from "@/services/subscription-request.service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== "super_admin") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  try {
    const { id } = await params;
    const data = await getSubscriptionRequestById(parseInt(id));
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== "super_admin") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  try {
    const body = await request.json();
    const { status, adminNote } = body;
    const { id } = await params;

    const result = await updateSubscriptionRequestStatus({
      id: parseInt(id),
      status: status as SubscriptionRequestStatus,
      adminNote,
      userId: user.id,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== "super_admin") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  try {
    const body = await request.json();
    const { id } = await params;
    const result = await addRequestNote({
      requestId: parseInt(id),
      note: body.note,
      userId: user.id,
      visibility: body.visibility || "internal",
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
