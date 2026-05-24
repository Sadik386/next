import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest, apiResponse, apiError } from "@/services/api.service";
import { registerWebhook } from "@/services/webhook.service";
import { guardWebhookCreation } from "@/lib/subscription-guard";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";

export async function POST(req: NextRequest) {
  let businessId: number | undefined;
  const auth = await authenticateApiRequest(req, "admin");
  if ("businessId" in auth) {
    businessId = auth.businessId;
  } else {
    const rbacAuth = await requirePermission(req, PERMISSIONS.MANAGE_WEBHOOKS);
    if (rbacAuth instanceof NextResponse) return apiError("Forbidden", 403);
    businessId = rbacAuth.businessId;
  }

  const guardResult = await guardWebhookCreation(businessId);
  if (!guardResult.allowed) {
    return apiError(guardResult.reason || "Webhook creation denied", 403);
  }

  const { name, url, events } = await req.json();
  if (!name || !url || !events) {
    return apiError("Missing required fields: name, url, events");
  }

  const webhook = await registerWebhook({
    businessId: businessId,
    name,
    url,
    events,
  });

  return apiResponse(webhook, 201);
}

export async function GET(req: NextRequest) {
  let businessId: number | undefined;
  const auth = await authenticateApiRequest(req, "admin");
  if ("businessId" in auth) {
    businessId = auth.businessId;
  } else {
    const rbacAuth = await requirePermission(req, PERMISSIONS.MANAGE_WEBHOOKS);
    if (rbacAuth instanceof NextResponse) return apiError("Forbidden", 403);
    businessId = rbacAuth.businessId;
  }

  const webhooks = await prisma.webhook.findMany({
    where: { businessId: businessId },
  });

  return apiResponse(webhooks.map(wh => {
    const { secret: _s, ...rest } = wh;
    return { ...rest, events: JSON.parse(wh.events ?? '[]') };
  }));
}