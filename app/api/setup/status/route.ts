import { NextResponse } from "next/server";
import { getSetupStatus, getUnavailableSetupStatus } from "@/services/setup.service";

export async function GET() {
  try {
    const data = await getSetupStatus();

    return NextResponse.json({ success: true, data, ...data });
  } catch {
    const data = getUnavailableSetupStatus();
    return NextResponse.json({
      success: false,
      message: "Setup status unavailable",
      data,
      ...data,
    });
  }
}
