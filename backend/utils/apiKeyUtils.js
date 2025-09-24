// utils/apiKeyUtils.js
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const ENC_KEY_BASE64 = process.env.API_KEY_ENC_KEY;
if (!ENC_KEY_BASE64) {
  throw new Error("Missing API_KEY_ENC_KEY env variable (base64 32 bytes)");
}

const ENC_KEY = Buffer.from(ENC_KEY_BASE64, "base64");
if (ENC_KEY.length !== 32) {
  throw new Error("API_KEY_ENC_KEY must decode to 32 bytes (base64)");
}

const ALGO = "aes-256-gcm";
const DEFAULT_KEY_LENGTH = parseInt(process.env.API_KEY_LENGTH || "48", 10);

/**
 * Generate a URL-safe API key string of length `len`.
 * Default length comes from API_KEY_LENGTH env or 48.
 */
export function generateApiKey(len = DEFAULT_KEY_LENGTH) {
  const bytes = Math.ceil((len * 3) / 4);
  // base64 -> url-safe -> remove padding -> slice to length
  return crypto
    .randomBytes(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    .slice(0, len);
}

/**
 * Generate a short keyId for public lookup (hex). Default 16 chars.
 */
export function generateKeyId(len = 16) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString("hex").slice(0, len);
}

/**
 * Encrypt plaintext API key using AES-256-GCM.
 * Returns a JSON string containing {v, iv, tag, data} (all base64).
 */
export function encryptApiKey(plain) {
  if (typeof plain !== "string") throw new TypeError("plain must be a string");

  const iv = crypto.randomBytes(12); // 12 bytes recommended for GCM
  const cipher = crypto.createCipheriv(ALGO, ENC_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    v: 1,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  });
}

/**
 * Decrypt JSON produced by encryptApiKey() and return plaintext.
 */
export function decryptApiKey(cipherJson) {
  if (!cipherJson) return null;
  const obj = typeof cipherJson === "string" ? JSON.parse(cipherJson) : cipherJson;

  if (!obj || obj.v !== 1) {
    throw new Error("Unsupported encryption version");
  }

  const iv = Buffer.from(obj.iv, "base64");
  const tag = Buffer.from(obj.tag, "base64");
  const data = Buffer.from(obj.data, "base64");

  const decipher = crypto.createDecipheriv(ALGO, ENC_KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  return decrypted;
}

/**
 * Verify a provided plaintext key against an encryptedKey JSON.
 * Uses timingSafeEqual for safe comparison.
 */
export function verifyApiKey(providedPlain, encryptedJson) {
  try {
    const storedPlain = decryptApiKey(encryptedJson);
    if (typeof storedPlain !== "string") return false;
    const a = Buffer.from(storedPlain, "utf8");
    const b = Buffer.from(providedPlain, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    return false;
  }
}

export function hashApiKey(plain) {
    return crypto.createHash('sha256').update(plain).digest('hex');
  }
