import { prisma } from "@/lib/prisma";
import { RoleName, canManageRole } from "@/constants/roles";

export async function getAllRoles() {
  return await prisma.role.findMany({ orderBy: { id: "asc" } });
}

export async function getAssignableRoles(actorRole: RoleName) {
  const allRoles = await getAllRoles();
  return allRoles.filter((role) => canManageRole(actorRole, role.name as RoleName));
}

export function validateRoleAssignment(actorRole: RoleName, targetRole: RoleName) {
  if (!canManageRole(actorRole, targetRole)) {
    return { allowed: false, reason: "You cannot assign this role" };
  }
  return { allowed: true };
}
