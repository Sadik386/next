import { prisma } from "@/lib/prisma";

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function createCategory(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" as const };
  const existing = await prisma.category.findFirst({
    where: { businessId: 1, name: trimmed },
  });
  if (existing) return { category: existing };
  const category = await prisma.category.create({
    data: { name: trimmed },
  });
  return { category };
}
