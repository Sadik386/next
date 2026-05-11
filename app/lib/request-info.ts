import { NextRequest } from "next/server";

export function getRequestInfo(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");

  const ip = cfIp || 
    (forwarded ? forwarded.split(",")[0].trim() : null) || 
    realIp || 
    "unknown";

  const userAgent = req.headers.get("user-agent") || "unknown";

  return { ip, userAgent };
}