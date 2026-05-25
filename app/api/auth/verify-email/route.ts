import { NextRequest, NextResponse } from "next/server";
import { verifyEmail } from "@/services/email-verification.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ success: false, error: "Verification token is required." }, { status: 400 });
  }

  const result = await verifyEmail(token);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "Your email has been verified. You can now sign in." });
}

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ success: false, error: "Verification token is required." }, { status: 400 });
  }

  const result = await verifyEmail(token);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "Your email has been verified. You can now sign in." });
}