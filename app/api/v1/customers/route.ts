import { NextRequest } from "next/server";
import { authenticateApiRequest, apiResponse, apiError } from "@/services/api.service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req, "read:customers");
  if ("error" in auth) return apiError(auth.error, auth.status);

  const customers = await prisma.customer.findMany({
    where: { businessId: auth.businessId, deletedAt: null },
  });

  return apiResponse(customers);
}

export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req, "write:customers");
  if ("error" in auth) return apiError(auth.error, auth.status);

  const data = await req.json();
  return apiResponse({ message: "Customer creation structure ready", received: data }, 201);
}
