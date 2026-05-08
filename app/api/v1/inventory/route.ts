import { NextRequest } from "next/server";
import { authenticateApiRequest, apiResponse, apiError } from "@/services/api.service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req, "read:inventory");
  if ("error" in auth) return apiError(auth.error, auth.status);

  const stock = await prisma.stock.findMany({
    where: { businessId: auth.businessId },
    include: { product: { select: { name: true, productId: true } } },
  });

  return apiResponse(stock);
}
