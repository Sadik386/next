import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { runWithBusinessContext } from "@/lib/business-context";
import { createPosSession } from "@/services/pos.service";
import { buildScannerUrl } from "@/lib/url";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.USE_POS);
  if (auth instanceof NextResponse) return auth;

  const user = { ...auth.user, businessId: auth.businessId };

  return runWithBusinessContext(user, async () => {
    try {
      const session = await createPosSession(auth.user.id);
      const mobileUrl = buildScannerUrl("pos", session.shortId, req);

      return NextResponse.json({
        sessionId: session.shortId,
        mobileUrl,
        expiresAt: session.expiresAt.toISOString(),
      });
    } catch (err) {
      console.error("Failed to start mobile session:", err);
      return NextResponse.json({ error: "Failed to start mobile session" }, { status: 500 });
    }
  });
}
