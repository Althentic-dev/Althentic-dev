// =============================================================================
// Althentic.Dev - Enkripsi at-rest untuk API key BYOK (SPEC-07-08)
// AES-256-GCM dengan key dari environment (CRYPTO_KEY).
// =============================================================================

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const KEY_HEX = process.env.CRYPTO_KEY;
const KEY = KEY_HEX && KEY_HEX.length === 64 ? Buffer.from(KEY_HEX, "hex") : randomBytes(32); // dev fallback

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptSecret(payload: string): string | null {
  try {
    const [ivHex, tagHex, encHex] = payload.split(":");
    if (!ivHex || !tagHex || !encHex) return null;
    const decipher = createDecipheriv("aes-256-gcm", KEY, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const dec = Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}

/** Tampilan ter-mask, mis. AIza...9f2c (SPEC-07-08). */
export function maskKey(key: string): string {
  if (key.length <= 8) return `${key.slice(0, 2)}****`;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
