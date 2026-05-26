import { NextRequest } from "next/server";
import { authenticateApiRequest, apiResponse, apiError } from "@/services/api.service";
import { prisma } from "@/lib/prisma";
import { guardReadOnlyWrite, SubscriptionGuardError } from "@/lib/subscription-guard";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req, "read:orders");
  if ("error" in auth) return apiError(auth.error, auth.status);

  const orders = await prisma.order.findMany({
    where: { businessId: auth.businessId, deletedAt: null },
    include: { items: true },
  });

  return apiResponse(orders);
}

export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req, "write:orders");
  if ("error" in auth) return apiError(auth.error, auth.status);

  try {
    await guardReadOnlyWrite(auth.businessId);
  } catch (guardErr) {
    if (guardErr instanceof SubscriptionGuardError) {
      return apiError(guardErr.message, guardErr.status);
    }
    throw guardErr;
  }

  const data = await req.json();
  return apiResponse({ message: "Order creation structure ready", received: data }, 201);
}
