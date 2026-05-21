export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  STORE_KEEPER: "store_keeper",
  STAFF: "staff",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<RoleName, number> = {
  super_admin: 100,
  admin: 80,
  manager: 60,
  store_keeper: 40,
  staff: 20,
};

export const ROLE_LABELS: Record<RoleName, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  store_keeper: "Store Keeper",
  staff: "Staff",
};

export function isRoleName(role: string | null | undefined): role is RoleName {
  return Object.values(ROLES).includes(role as RoleName);
}

export function isHigherRole(roleA: RoleName, roleB: RoleName): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}

export function canManageBusinessRole(actorRole: RoleName, targetRole: RoleName): boolean {
  if (targetRole === ROLES.SUPER_ADMIN) return false;
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

export function canManageRole(actorRole: RoleName, targetRole: RoleName): boolean {
  return canManageBusinessRole(actorRole, targetRole);
}
