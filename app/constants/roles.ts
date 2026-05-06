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

export function isHigherRole(roleA: RoleName, roleB: RoleName): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}

export function canManageRole(actorRole: RoleName, targetRole: RoleName): boolean {
  if (actorRole === ROLES.SUPER_ADMIN) return true;
  if (targetRole === ROLES.SUPER_ADMIN) return false;
  if (actorRole === ROLES.ADMIN) return targetRole !== ROLES.ADMIN;
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}
