import { prisma } from "@/lib/prisma";
import { createLog } from "@/services/activity-log.service";
import { getCurrentBusinessId } from "@/lib/business";

export async function getCategories() {
  return prisma.category.findMany({ where: { businessId: getCurrentBusinessId() }, orderBy: { name: "asc" } });
}

export async function createCategory(name: string, userId: number) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" as const };
  const existing = await prisma.category.findFirst({
    where: { businessId: getCurrentBusinessId(), name: trimmed },
  });
  if (existing) return { category: existing };
  const category = await prisma.category.create({
    data: { businessId: getCurrentBusinessId(), name: trimmed },
  });

  await createLog({
    userId,
    action: "create",
    module: "category",
    entityId: String(category.id),
    entityName: category.name,
    description: `Created category: ${category.name}`,
  });

  return { category };
}

export async function deleteCategory(id: number, userId: number) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new Error("Category not found");

  await prisma.category.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      userId,
      action: "DELETE",
      module: "category",
      entityId: String(id),
      entityName: category.name,
      description: `Deleted category: ${category.name}`,
    },
  });
}
