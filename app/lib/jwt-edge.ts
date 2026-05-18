import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface EdgeJWTPayload {
  id: number;
  name: string;
  email: string;
  role: string;
  username?: string;
  businessId?: number;
}

export async function verifyTokenEdge(token: string): Promise<EdgeJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as EdgeJWTPayload;
  } catch {
    return null;
  }
}
