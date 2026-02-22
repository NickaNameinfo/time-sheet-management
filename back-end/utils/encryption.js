import crypto from "crypto";

const ALGO = "aes-256-gcm";
const KEY_LEN = 32;
const IV_LEN = 16;
const SALT_LEN = 64;
const TAG_LEN = 16;

function getKey() {
  const raw = process.env.INV_ENCRYPTION_KEY || "default-investment-encryption-key-32bytes!!";
  return crypto.scryptSync(raw, "inv-salt", KEY_LEN);
}

export function encrypt(plainText) {
  if (!plainText) return null;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(cipherText) {
  if (!cipherText) return null;
  try {
    const key = getKey();
    const buf = Buffer.from(cipherText, "base64");
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const enc = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(enc) + decipher.final("utf8");
  } catch {
    return null;
  }
}

export function maskAadhaar(value) {
  if (!value || value.length < 4) return "****";
  return "****" + value.slice(-4);
}

export function maskPan(value) {
  if (!value || value.length < 4) return "****";
  return value.slice(0, 2) + "****" + value.slice(-4);
}

export function maskAccount(value) {
  if (!value || value.length < 4) return "****";
  return "****" + value.slice(-4);
}
