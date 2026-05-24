import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const jwtSecret = process.env.JWT_SECRET;

  if (!encryptionKey && !jwtSecret) {
    throw new Error("Encryption key not configured. Set ENCRYPTION_KEY environment variable.");
  }

  const keySource = encryptionKey || jwtSecret;

  if (!encryptionKey && jwtSecret) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[SECURITY] ENCRYPTION_KEY is not set. Using JWT_SECRET as fallback is not recommended in production. " +
          "Please set a dedicated ENCRYPTION_KEY environment variable."
      );
    }
  }

  return crypto.createHash("sha256").update(keySource!).digest();
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  // Format: iv:tag:encrypted
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decryptSecret(encrypted: string): string {
  if (!encrypted) return "";
  try {
    const key = getEncryptionKey();
    const parts = encrypted.split(":");
    if (parts.length !== 3) {
      // Not encrypted format, return as-is (backwards compatibility)
      return encrypted;
    }
    const [ivHex, tagHex, encryptedData] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
}

export function maskSecret(_secret: string): string {
  return "********";
}