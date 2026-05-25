import { SignJWT, jwtVerify } from "jose";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export interface JWTPayload {
  id: number;
  name: string;
  email: string;
  role: string;
  username?: string;
  businessId?: number;
  isFounder?: boolean;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
