import {
  getActiveBusinessContext,
  getActiveBusinessId,
  BusinessContextError,
  type BusinessContext,
} from "@/lib/business-context";

export { BusinessContextError };

export function getCurrentBusinessContext(
  _user?: unknown
): BusinessContext {
  return getActiveBusinessContext();
}

export function getCurrentBusinessId(_user?: unknown): number {
  return getActiveBusinessId();
}
