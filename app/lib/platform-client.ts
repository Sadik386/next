import { ROLES } from "@/constants/roles";
import { currentAppMode } from "./config/app-mode";

/**
 * Simple check for UI components.
 * safe for client-side as it doesn't import server-only modules.
 */
export function canAccessPlatform(user: { role: string; isFounder?: boolean } | null | undefined): boolean {
  return currentAppMode === "cloud" && user?.role === ROLES.SUPER_ADMIN && user?.isFounder === true;
}
