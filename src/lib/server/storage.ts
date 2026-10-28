// =============================================================================
// Althentic.Dev - Storage abstraction (SPEC-15-01, SPEC-07-06, SPEC-16-04)
// Interface tunggal bucket publik/private. Sandbox: filesystem lokal.
// Production: implementasi Supabase Storage dengan kontrak sama (ganti 1 file).
// Signed URL: HMAC-SHA256, durasi default 1 jam (GAP-19).
// =============================================================================

import { createHmac, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile, unlink, stat } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getServerSecret } from "@/lib/server/secrets";

const ROOT = process.env.STORAGE_ROOT || "/home/z/my-project/storage";
export const SIGNED_URL_TTL = 3600; // 1 jam (GAP-19)

type Bucket = "public" | "private";

function safeJoin(bucket: Bucket, objectPath: string): string {
  const clean = objectPath.replace(/\\/g, "/").replace(/\.\./g, "").replace(/^\/+/, "");
  const full = path.join(ROOT, bucket, clean);
  if (!full.startsWith(path.join(ROOT, bucket))) {
    throw new Error("Path tidak valid.");
  }
  return full;
}

export async function putObject(
  bucket: Bucket,
  objectPath: string,
  data: Buffer,
  _contentType?: string
): Promise<string> {
  const full = safeJoin(bucket, objectPath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return `${bucket}/${objectPath}`;
}

export async function getObject(bucket: Bucket, objectPath: string): Promise<Buffer | null> {
  try {
    const full = safeJoin(bucket, objectPath);
    return await readFile(full);
  } catch {
    return null;
  }
}

export async function deleteObject(bucket: Bucket, objectPath: string): Promise<void> {
  try {
    const full = safeJoin(bucket, objectPath);
    await unlink(full);
  } catch {
    /* sudah terhapus */
  }
}

export async function objectExists(bucket: Bucket, objectPath: string): Promise<boolean> {
  try {
    await stat(safeJoin(bucket, objectPath));
    return true;
  } catch {
    return false;
  }
}

/** Konversi gambar ke .webp (bukti SPEC-07-06, banner SPEC-02-03). */
export async function convertToWebp(input: Buffer, maxWidth?: number): Promise<Buffer> {
  let img = sharp(input, { failOn: "none" });
  if (maxWidth) img = img.resize({ width: maxWidth, withoutEnlargement: true });
  return img.webp({ quality: 82 }).toBuffer();
}

function sign(payload: string): string {
  return createHmac("sha256", getServerSecret("AUTH_SECRET", "dev-secret")).update(payload).digest("hex");
}

/** URL objek - bucket public tanpa signature; private wajib signature berumur pendek. */
export function fileUrl(bucket: Bucket, objectPath: string, ttlSec = SIGNED_URL_TTL): string {
  const q = new URLSearchParams({ bucket, path: objectPath });
  if (bucket === "private") {
    const exp = Math.floor(Date.now() / 1000) + ttlSec;
    q.set("exp", String(exp));
    q.set("sig", sign(`${bucket}/${objectPath}:${exp}`));
  }
  return `/api/files?${q.toString()}`;
}

/** Verifikasi signature URL private (dipakai route /api/files). */
export function verifyFileSignature(
  bucket: string,
  objectPath: string,
  exp: string,
  sig: string
): boolean {
  const expNum = parseInt(exp, 10);
  if (!expNum || expNum < Math.floor(Date.now() / 1000)) return false;
  const expected = sign(`${bucket}/${objectPath}:${expNum}`);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
