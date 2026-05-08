import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { generateApiKey, hashKey } from "@/lib/api-key";
import { prisma } from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/business";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { name, permissions } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const rawKey = generateApiKey();
  const hashed = hashKey(rawKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      businessId: getCurrentBusinessId(),
      name,
      key: hashed,
      permissions: JSON.stringify(permissions || ["read:products"]),
    },
  });

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
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const keys = await prisma.apiKey.findMany({
    where: { businessId: getCurrentBusinessId() },
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
    permissions: JSON.parse(k.permissions),
  })));
}
