import { NextRequest } from "next/server";
import { triggerWebhook } from "@/services/webhook.service";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { apiResponse, apiError } from "@/services/api.service";
import { checkRateLimit } from "@/lib/rate-limit";
import { guardReadOnlyWrite, SubscriptionGuardError } from "@/lib/subscription-guard";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.MANAGE_WEBHOOKS);
  if (auth instanceof Response) return auth;

  try {
    await guardReadOnlyWrite(auth.businessId);
  } catch (guardErr) {
    if (guardErr instanceof SubscriptionGuardError) {
      return apiError(guardErr.message, guardErr.status);
    }
    throw guardErr;
  }

  if (!checkRateLimit(`webhook-trigger:${auth.businessId}`, { windowMs: 60 * 1000, maxRequests: 10 })) {
    return apiError("Too many webhook triggers. Wait a minute.", 429);
  }

  const { event, payload } = await req.json();
  if (!event || !payload) {
    return apiError("Missing required fields: event, payload");
  }

  await triggerWebhook(event, payload, auth.businessId);

  return apiResponse({ message: `Triggered ${event}` });
}
