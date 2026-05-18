import { NextRequest, NextResponse } from "next/server";
import { createProductScanSession } from "@/services/scanner.service";
import { buildScannerUrl } from "@/lib/url";

export async function POST(req: NextRequest) {
  try {
    const session = createProductScanSession();
    const mobileUrl = buildScannerUrl("products", session.id, req);

    return NextResponse.json({
      sessionId: session.id,
      mobileUrl,
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("Failed to start products scanner session:", err);
    return NextResponse.json({ error: "Failed to start scanner session" }, { status: 500 });
  }
}