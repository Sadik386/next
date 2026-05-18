import { verifyToken } from "./jwt";
import {
  BusinessContextError,
  setActiveBusinessContextForUser,
} from "@/lib/business-context";

export async function getAuthUser() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  const user = await verifyToken(token);
  if (user) {
    try {
      const businessContext = await setActiveBusinessContextForUser(user);
      return { ...user, businessId: businessContext.businessId };
    } catch (error) {
      if (error instanceof BusinessContextError) return null;
      throw error;
    }
  }
  return null;
}
