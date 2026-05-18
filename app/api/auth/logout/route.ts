import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { setActiveBusinessContextForUser } from "@/lib/business-context";
import { createLog } from "@/services/activity-log.service";
import { getRequestInfo } from "@/lib/request-info";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (token) {
    try {
      const payload = await verifyToken(token);
      if (payload?.id) {
        await setActiveBusinessContextForUser(payload);
        const { ip, userAgent } = getRequestInfo(req);
        await createLog({
          userId: payload.id,
          action: "logout",
          module: "auth",
          entityId: String(payload.id),
          entityName: payload.name,
          description: `${payload.name} logged out`,
          ipAddress: ip,
          userAgent,
        });
      }
    } catch {
      // silently ignore errors - logout must still proceed
    }
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set("auth_token", "", { httpOnly: true, maxAge: 0, path: "/" });
  return res;
}
