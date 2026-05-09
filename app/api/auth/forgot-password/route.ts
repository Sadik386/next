import { NextRequest, NextResponse } from "next/server";
import { forgotPassword } from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const result = await forgotPassword(email);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: result.message, devToken: result.devToken });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}