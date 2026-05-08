import { NextRequest } from "next/server";
import { triggerWebhook } from "@/services/webhook.service";
import { requireAuth } from "@/lib/rbac";
import { apiResponse, apiError } from "@/services/api.service";
import { getCurrentBusinessId } from "@/lib/business";

export async function POST(req: NextRequest) {
  // Allow manually triggering for testing - requires admin login
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const { event, payload } = await req.json();
  if (!event || !payload) {
    return apiError("Missing required fields: event, payload");
  }

  await triggerWebhook(event, payload, getCurrentBusinessId());

  return apiResponse({ message: `Triggered ${event}` });
}
