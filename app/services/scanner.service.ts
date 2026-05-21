import { createHmac, timingSafeEqual } from "crypto";

const SHORT_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateShortId(prefix: string): string {
  let result = prefix;
  for (let i = 0; i < 6; i++) {
    result += SHORT_ID_CHARS.charAt(Math.floor(Math.random() * SHORT_ID_CHARS.length));
  }
  return result;
}

function getSessionSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
  return secret;
}

function signProductScanSessionScope(sessionId: string, businessId: number) {
  return createHmac("sha256", getSessionSecret())
    .update(`products:${businessId}:${sessionId}`)
    .digest("base64url");
}

export function createProductScanSessionAccessToken(sessionId: string, businessId: number) {
  return `${businessId}.${signProductScanSessionScope(sessionId, businessId)}`;
}

export function getBusinessIdFromProductScanSessionToken(
  sessionId: string,
  token: string | null
) {
  if (!token) return null;
  const [businessIdRaw, signature, ...rest] = token.split(".");
  if (rest.length > 0 || !businessIdRaw || !signature) return null;

  const businessId = Number(businessIdRaw);
  if (!Number.isInteger(businessId) || businessId <= 0) return null;

  const expected = signProductScanSessionScope(sessionId, businessId);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  return timingSafeEqual(signatureBuffer, expectedBuffer) ? businessId : null;
}

export interface ProductScanMatch {
  id: number;
  productId: string;
  name: string;
  sku: string | null;
}

export interface ProductScanSession {
  id: string;
  businessId: number;
  status: "active" | "expired";
  scannedCode: string | null;
  product: ProductScanMatch | null;
  createdAt: Date;
  expiresAt: Date;
}

const scannerSessionStore = globalThis as typeof globalThis & {
  __accorazeProductScanSessions?: Map<string, ProductScanSession>;
};

const sessions =
  scannerSessionStore.__accorazeProductScanSessions ??
  (scannerSessionStore.__accorazeProductScanSessions = new Map<string, ProductScanSession>());

export function createProductScanSession(businessId: number): ProductScanSession {
  let id = generateShortId("PRD-SCN-");
  for (let attempt = 0; attempt < 5; attempt++) {
    if (!sessions.has(id)) break;
    id = generateShortId("PRD-SCN-");
  }

  const session: ProductScanSession = {
    id,
    businessId,
    status: "active",
    scannedCode: null,
    product: null,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  };
  sessions.set(id, session);
  return session;
}

export function getProductScanSession(
  id: string,
  businessId?: number
): ProductScanSession | null {
  const session = sessions.get(id);
  if (!session) return null;
  if (businessId !== undefined && session.businessId !== businessId) return null;
  if (session.status === "active" && session.expiresAt < new Date()) {
    session.status = "expired";
    return session;
  }
  return session;
}

export function submitProductScan(
  id: string,
  code: string,
  businessId: number,
  product: ProductScanMatch | null = null
): { success: boolean; error?: string } {
  const session = getProductScanSession(id, businessId);
  if (!session) return { success: false, error: "Session not found" };
  if (session.status !== "active") return { success: false, error: "Session is not active" };
  if (session.expiresAt < new Date()) {
    session.status = "expired";
    return { success: false, error: "Session expired" };
  }

  const trimmed = code.trim();
  if (!trimmed) return { success: false, error: "Code is required" };

  session.scannedCode = trimmed;
  session.product = product;
  return { success: true };
}

export function clearProductScan(id: string): boolean {
  const session = sessions.get(id);
  if (!session) return false;
  session.scannedCode = null;
  session.product = null;
  return true;
}
