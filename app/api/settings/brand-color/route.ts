import { NextResponse } from "next/server";
import { getBrandColor } from "@/services/setting.service";

export async function GET() {
  try {
    const brandColor = await getBrandColor();
    return NextResponse.json({ brandColor });
  } catch {
    return NextResponse.json({ brandColor: "#C4973A" });
  }
}
