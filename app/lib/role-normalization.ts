import { ROLES, RoleName } from "@/constants/roles";
import type { Permission } from "@/constants/permissions";
import { ROLE_PERMISSIONS } from "@/constants/permissions";

/**
 * Normalizes a role value to its canonical lowercase form.
 * Handles various casing formats and ensures safe fallback.
 *
 * @param role - The role value to normalize (can be any string)
 * @returns The canonical role name if valid, or null if invalid
 */
export function normalizeRole(role: string | null | undefined): RoleName | null {
  if (!role) return null;

  // Convert to lowercase and trim
  const normalized = role.toString().toLowerCase().trim();

  // Check if it matches any of our canonical role names
  if (Object.values(ROLES).includes(normalized as RoleName)) {
    return normalized as RoleName;
  }

  // Handle common display variations
  const displayToCanonical: Record<string, RoleName> = {
    "super admin": ROLES.SUPER_ADMIN,
    admin: ROLES.ADMIN,
    manager: ROLES.MANAGER,
    "store keeper": ROLES.STORE_KEEPER,
    staff: ROLES.STAFF,
  };

  return displayToCanonical[normalized] ?? null;
}

/**
 * Safely gets the permissions for a role, normalizing the role first.
 *
 * @param role - The role value (may be non-canonical)
 * @returns The permissions array for the role, or empty array if invalid
 */
export function getRolePermissions(role: string | null | undefined): Permission[] {
  const normalized = normalizeRole(role);
  if (!normalized) return [];
  
  return ROLE_PERMISSIONS[normalized] ?? [];
}

/**
 * Checks if a role has a specific permission, with normalization.
 *
 * @param role - The role value (may be non-canonical)
 * @param permission - The permission to check
 * @returns True if the role has the permission, false otherwise
 */
export function hasNormalizedPermission(
  role: string | null | undefined,
  permission: Permission
): boolean {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  
  const permissions = ROLE_PERMISSIONS[normalized] ?? [];
  return permissions.includes(permission);
}