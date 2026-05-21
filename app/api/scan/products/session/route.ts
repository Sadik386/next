import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import {
  createProductScanSession,
  createProductScanSessionAccessToken,
} from "@/services/scanner.service";
import { buildScannerUrl } from "@/lib/url";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const session = createProductScanSession(auth.businessId);
    const token = createProductScanSessionAccessToken(session.id, auth.businessId);
    const mobileUrl = new URL(buildScannerUrl("products", session.id, req));
    mobileUrl.searchParams.set("token", token);

    return NextResponse.json({
      sessionId: session.id,
      mobileUrl: mobileUrl.toString(),
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("Failed to start products scanner session:", err);
    return NextResponse.json({ error: "Failed to start scanner session" }, { status: 500 });
  }
}
