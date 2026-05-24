import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, hasApiPermission } from "@/lib/api-key";
import { guardApiUsage } from "@/lib/subscription-guard";
import { incrementUsageSafely } from "@/lib/usage-service";
import { USAGE_KEYS } from "@/lib/pricing";

type AuthResult = 
  | { businessId: number; permissions: string[] }
  | { error: string; status: number };

export async function authenticateApiRequest(req: NextRequest, requiredPermission?: string): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Missing or invalid API key", status: 401 };
  }

  const key = authHeader.substring(7);
  const result = await validateApiKey(key);

  if (!result) {
    return { error: "Invalid or expired API key", status: 401 };
  }

  if (requiredPermission && !hasApiPermission(result.permissions, requiredPermission)) {
    return { error: "Forbidden: Missing required permission", status: 403 };
  }

  // Check API usage guard (trial expiry, API access feature, subscription status, API call limits)
  const guardResult = await guardApiUsage(result.businessId);
  if (!guardResult.allowed) {
    return { error: guardResult.reason || "API access denied", status: 403 };
  }

  // Track API call usage after successful authentication
  await incrementUsageSafely(result.businessId, USAGE_KEYS.API_CALLS);

  return { businessId: result.businessId, permissions: result.permissions };
}

export function apiResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  if (status === 401) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status }
    );
  }

  if (status === 403) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status }
    );
  }

  return NextResponse.json({ success: false, message }, { status });
}
