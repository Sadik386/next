import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";

export function generateApiKey(): string {
  // Generate a random 32-byte key and return as hex (64 chars)
  return randomBytes(32).toString("hex");
}

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function validateApiKey(key: string) {
  if (!key) return null;
  
  // We store hashed keys for security
  const hashed = hashKey(key);
  
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hashed },
  });

  if (!apiKey || !apiKey.isActive) return null;

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null;
  }

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    businessId: apiKey.businessId,
    permissions: JSON.parse(apiKey.permissions) as string[],
  };
}

export function hasApiPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes("admin");
}
