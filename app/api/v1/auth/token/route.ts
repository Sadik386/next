import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { generateApiKey, hashKey } from "@/lib/api-key";
import { prisma } from "@/lib/prisma";
import { USAGE_KEYS } from "@/lib/pricing";
import { guardApiKeyCreation } from "@/lib/subscription-guard";
import { incrementUsageSafely } from "@/lib/usage-service";

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.MANAGE_API_KEYS);
  if (auth instanceof NextResponse) return auth;

  const { name, permissions } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const guard = await guardApiKeyCreation(auth.businessId);
  if (!guard.allowed) {
    return NextResponse.json(
      { error: guard.reason ?? "API access is not available on your current plan." },
      { status: 403 }
    );
  }

  const rawKey = generateApiKey();
  const hashed = hashKey(rawKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      businessId: auth.businessId,
      name,
      key: hashed,
      permissions: JSON.stringify(permissions || ["read:products"]),
    },
  });

  await incrementUsageSafely(auth.businessId, USAGE_KEYS.API_KEYS_CREATED);

  // Return the RAW key only ONCE
  return NextResponse.json({
    id: apiKey.id,
    name: apiKey.name,
    key: rawKey,
    permissions: JSON.parse(apiKey.permissions),
    createdAt: apiKey.createdAt,
  });
}

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, PERMISSIONS.MANAGE_API_KEYS);
  if (auth instanceof NextResponse) return auth;

  const keys = await prisma.apiKey.findMany({
    where: { businessId: auth.businessId },
    select: {
      id: true,
      name: true,
      isActive: true,
      permissions: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(keys.map(k => ({
    ...k,
    permissions: JSON.parse(k.permissions ?? '[]'),
  })));
}
