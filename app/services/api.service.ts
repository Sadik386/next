import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, hasApiPermission } from "@/lib/api-key";

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

  return { businessId: result.businessId, permissions: result.permissions };
}

export function apiResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
