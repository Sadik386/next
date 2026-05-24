import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "accoraze",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(health);
  } catch {
    return NextResponse.json(
      { ...health, status: "degraded", database: "unavailable" },
      { status: 503 }
    );
  }
}