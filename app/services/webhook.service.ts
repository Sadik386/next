import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

export type WebhookEvent =
  | "order.created"
  | "order.updated"
  | "order.cancelled"
  | "order.paid"
  | "product.created"
  | "product.updated"
  | "stock.low"
  | "stock.out"
  | "customer.created"
  | "payment.received"
  | "delivery.dispatched";

export async function registerWebhook(data: {
  businessId: number;
  name: string;
  url: string;
  events: WebhookEvent[];
}) {
  const secret = `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  
  return await prisma.webhook.create({
    data: {
      businessId: data.businessId,
      name: data.name,
      url: data.url,
      secret,
      events: JSON.stringify(data.events),
    },
  });
}

export async function triggerWebhook(
  event: WebhookEvent,
  payload: any,
  businessId: number
) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      businessId,
      isActive: true,
    },
  });

  const matchingWebhooks = webhooks.filter((wh) => {
    const events = JSON.parse(wh.events ?? '[]') as string[];
    return events.includes(event);
  });

  for (const wh of matchingWebhooks) {
    void sendWebhook(wh, event, payload);
  }
}

async function sendWebhook(webhook: any, event: string, payload: any) {
  const payloadString = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  // HMAC-SHA256 signature
  const signature = createHmac("sha256", webhook.secret)
    .update(payloadString)
    .digest("hex");

  let success = false;
  let responseText = "";
  let statusCode = 0;

  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-NextGenPOS-Event": event,
        "X-NextGenPOS-Signature": signature,
      },
      body: payloadString,
    });

    statusCode = res.status;
    responseText = await res.text();
    success = res.ok;
  } catch (err: any) {
    responseText = err.message || "Failed to connect";
  }

  // Log it
  await prisma.webhookLog.create({
    data: {
      webhookId: webhook.id,
      event,
      payload: payloadString,
      response: responseText.substring(0, 1000), // Truncate if long
      statusCode,
      success,
    },
  });

  // Update webhook stats
  if (success) {
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { lastFiredAt: new Date(), failCount: 0 },
    });
  } else {
    const updated = await prisma.webhook.update({
      where: { id: webhook.id },
      data: { failCount: { increment: 1 } },
    });

    // Disable after 10 failures
    if (updated.failCount >= 10) {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { isActive: false },
      });
    }
  }
}
