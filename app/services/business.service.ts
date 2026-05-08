import { prisma } from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/business";

export async function getBusiness() {
  const id = getCurrentBusinessId();
  return prisma.business.findUnique({
    where: { id },
  });
}

export async function updateBusiness(data: { name?: string; slug?: string }) {
  const id = getCurrentBusinessId();
  return prisma.business.update({
    where: { id },
    data,
  });
}
