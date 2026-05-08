import { NextRequest } from "next/server";
import { authenticateApiRequest, apiResponse, apiError } from "@/services/api.service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req, "read:products");
  if ("error" in auth) return apiError(auth.error, auth.status);

  const products = await prisma.product.findMany({
    where: { businessId: auth.businessId, deletedAt: null },
    include: { stock: true },
  });

  return apiResponse(products);
}
