const SHORT_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateShortId(prefix: string): string {
  let result = prefix;
  for (let i = 0; i < 6; i++) {
    result += SHORT_ID_CHARS.charAt(Math.floor(Math.random() * SHORT_ID_CHARS.length));
  }
  return result;
}

export interface ProductScanSession {
  id: string;
  status: "active" | "expired";
  scannedCode: string | null;
  createdAt: Date;
  expiresAt: Date;
}

const sessions = new Map<string, ProductScanSession>();

export function createProductScanSession(): ProductScanSession {
  let id = generateShortId("PRD-SCN-");
  for (let attempt = 0; attempt < 5; attempt++) {
    if (!sessions.has(id)) break;
    id = generateShortId("PRD-SCN-");
  }

  const session: ProductScanSession = {
    id,
    status: "active",
    scannedCode: null,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  };
  sessions.set(id, session);
  return session;
}

export function getProductScanSession(id: string): ProductScanSession | null {
  const session = sessions.get(id);
  if (!session) return null;
  if (session.status === "active" && session.expiresAt < new Date()) {
    session.status = "expired";
    return session;
  }
  return session;
}

export function submitProductScan(id: string, code: string): { success: boolean; error?: string } {
  const session = getProductScanSession(id);
  if (!session) return { success: false, error: "Session not found" };
  if (session.status !== "active") return { success: false, error: "Session is not active" };
  if (session.expiresAt < new Date()) {
    session.status = "expired";
    return { success: false, error: "Session expired" };
  }

  const trimmed = code.trim();
  if (!trimmed) return { success: false, error: "Code is required" };

  session.scannedCode = trimmed;
  return { success: true };
}

export function clearProductScan(id: string): boolean {
  const session = sessions.get(id);
  if (!session) return false;
  session.scannedCode = null;
  return true;
}