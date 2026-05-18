import { NextRequest } from "next/server";
import { authenticateApiRequest, apiResponse, apiError } from "@/services/api.service";
import { registerWebhook } from "@/services/webhook.service";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req, "admin");
  if ("error" in auth) return apiError(auth.error, auth.status);

  const { name, url, events } = await req.json();
  if (!name || !url || !events) {
    return apiError("Missing required fields: name, url, events");
  }

  const webhook = await registerWebhook({
    businessId: auth.businessId,
    name,
    url,
    events,
  });

  return apiResponse(webhook, 201);
}

export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req, "admin");
  if ("error" in auth) return apiError(auth.error, auth.status);

  const webhooks = await prisma.webhook.findMany({
    where: { businessId: auth.businessId },
  });

  return apiResponse(webhooks.map(wh => {
    const { secret: _s, ...rest } = wh;
    return { ...rest, events: JSON.parse(wh.events ?? '[]') };
  }));
}
