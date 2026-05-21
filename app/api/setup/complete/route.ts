import { NextRequest, NextResponse } from "next/server";
import { completeSetup, SetupServiceError } from "@/services/setup.service";

function setupError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, message, error: message },
    { status }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await completeSetup(body);

    const responseData = {
      user: result.user,
      runtime: result.runtime,
    };

    const response = NextResponse.json({
      success: true,
      message: "Setup complete",
      data: responseData,
      ...responseData,
    });
    response.cookies.set("auth_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (err) {
    if (err instanceof SetupServiceError) {
      return setupError(err.message, err.status);
    }
    console.error("Setup error:", err);
    return setupError("Server error", 500);
  }
}
