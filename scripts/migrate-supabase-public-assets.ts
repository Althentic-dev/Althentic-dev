import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { publicAssetExists, supabaseFetch } from "../src/lib/server/supabase-storage";

type BucketName = "banners" | "previews";
type MigrationFile = {
  objectPath: string;
  bucket: BucketName;
  sha256: string;
  bytes: number;
  contentType: string;
  data: Buffer;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment ${name} wajib diisi.`);
  return value;
}

function bucketFor(objectPath: string): BucketName {
  if (objectPath.startsWith("banners/") || objectPath.startsWith("qr/")) return "banners";
  if (objectPath.startsWith("products/")) return "previews";
  throw new Error("Ada file storage/public dengan prefix yang tidak dipetakan ke bucket Supabase.");
}

function contentTypeFor(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case ".webp": return "image/webp";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".avif": return "image/avif";
    default: return "application/octet-stream";
  }
}

async function collectFiles(root: string, current = root): Promise<MigrationFile[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files: MigrationFile[] = [];
  for (const entry of entries) {
    const fullPath = path.join(current, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error("Sumber migrasi tidak boleh memuat symbolic link.");
    }
    if (entry.isDirectory()) {
      files.push(...await collectFiles(root, fullPath));
      continue;
    }
    if (!entry.isFile()) throw new Error("Sumber migrasi memuat entri file yang tidak didukung.");

    const objectPath = path.relative(root, fullPath).split(path.sep).join("/");
    const data = await readFile(fullPath);
    files.push({
      objectPath,
      bucket: bucketFor(objectPath),
      sha256: createHash("sha256").update(data).digest("hex"),
      bytes: data.byteLength,
      contentType: contentTypeFor(fullPath),
      data,
    });
  }
  return files;
}

function sha256(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const sourceIndex = args.indexOf("--source");
  if (sourceIndex >= 0 && !args[sourceIndex + 1]) {
    throw new Error("Argumen --source membutuhkan path folder.");
  }
  const sourceRoot = path.resolve(sourceIndex >= 0 ? args[sourceIndex + 1] ?? "" : "storage/public");
  const sourceFiles = await collectFiles(sourceRoot);
  if (sourceFiles.length === 0) throw new Error("Tidak ada file untuk dimigrasikan.");

  const endpoint = requiredEnv("SUPABASE_URL");
  const endpointUrl = new URL(endpoint);
  if (endpointUrl.protocol !== "https:" || endpointUrl.username || endpointUrl.password) {
    throw new Error("SUPABASE_URL harus berupa endpoint HTTPS tanpa kredensial.");
  }
  const client = createClient(endpoint, requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: supabaseFetch },
  });
  const bucketNames: Record<BucketName, string> = {
    banners: requiredEnv("SUPABASE_STORAGE_BUCKET_BANNERS"),
    previews: requiredEnv("SUPABASE_STORAGE_BUCKET_PREVIEWS"),
  };
  for (const bucketName of Object.values(bucketNames)) {
    if (!/^[a-z0-9][a-z0-9_-]{0,62}$/.test(bucketName)) {
      throw new Error("Nama bucket Supabase tidak valid.");
    }
  }

  const { data: configuredBuckets, error: bucketsError } = await client.storage.listBuckets();
  if (bucketsError || !configuredBuckets) {
    const rawStatus = bucketsError && "status" in bucketsError ? bucketsError.status : undefined;
    const rawStatusCode = bucketsError && "statusCode" in bucketsError ? bucketsError.statusCode : undefined;
    const status = [rawStatus, rawStatusCode]
      .find((value) => typeof value === "number" || (typeof value === "string" && /^\d{3}$/.test(value)));
    const errorName = bucketsError?.name && /^[A-Za-z][A-Za-z0-9]*$/.test(bucketsError.name)
      ? bucketsError.name
      : "unknown";
    throw new Error(`Tidak dapat membaca bucket Supabase dengan service role (${errorName}${status ? `, HTTP ${status}` : ""}).`);
  }
  for (const bucketName of Object.values(bucketNames)) {
    const bucket = configuredBuckets.find((candidate) => candidate.name === bucketName);
    if (!bucket) throw new Error("Salah satu bucket yang dikonfigurasi tidak ditemukan di Supabase.");
    if (!bucket.public) throw new Error("Kedua bucket aset harus diatur Public sebelum migrasi.");
  }

  const existingByPath = new Map<string, boolean>();
  for (const file of sourceFiles) {
    const bucket = client.storage.from(bucketNames[file.bucket]);
    const { data, error } = await bucket.download(file.objectPath);
    if (error) {
      if (error.statusCode === "404") {
        existingByPath.set(`${file.bucket}/${file.objectPath}`, false);
        continue;
      }
      throw new Error(`Preflight Supabase gagal (HTTP ${error.statusCode ?? "unknown"}).`);
    }
    if (!data) throw new Error("Preflight Supabase tidak mengembalikan object.");
    const remoteHash = sha256(Buffer.from(await data.arrayBuffer()));
    if (remoteHash !== file.sha256) {
      throw new Error("Migrasi dibatalkan karena ada object target dengan isi berbeda.");
    }
    if (!await publicAssetExists(file.objectPath)) {
      throw new Error("Migrasi dibatalkan karena object yang ada belum dapat diakses secara publik.");
    }
    existingByPath.set(`${file.bucket}/${file.objectPath}`, true);
  }

  const pending = sourceFiles.filter((file) => !existingByPath.get(`${file.bucket}/${file.objectPath}`));
  const totalBytes = sourceFiles.reduce((sum, file) => sum + file.bytes, 0);
  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    files: sourceFiles.length,
    bytes: totalBytes,
    alreadyMatching: sourceFiles.length - pending.length,
    toUpload: pending.length,
    sourcePreserved: true,
  }));
  if (!apply) return;

  for (const file of pending) {
    const bucket = client.storage.from(bucketNames[file.bucket]);
    const { error } = await bucket.upload(file.objectPath, file.data, {
      contentType: file.contentType,
      cacheControl: "86400",
      upsert: false,
    });
    if (error) throw new Error(`Unggah Supabase gagal (HTTP ${error.statusCode ?? "unknown"}). Jalankan ulang setelah memeriksa bucket.`);

    const { data, error: downloadError } = await bucket.download(file.objectPath);
    if (downloadError || !data) throw new Error("Verifikasi unduhan setelah unggah gagal.");
    const remoteHash = sha256(Buffer.from(await data.arrayBuffer()));
    if (remoteHash !== file.sha256) throw new Error("Hash object Supabase tidak cocok dengan sumber.");
  }

  const publicChecks = await Promise.all(sourceFiles.map((file) => publicAssetExists(file.objectPath)));
  if (publicChecks.some((isPublic) => !isPublic)) {
    throw new Error("Verifikasi URL publik Supabase gagal untuk salah satu object.");
  }

  console.log(JSON.stringify({ verifiedUploads: pending.length, verifiedPublicObjects: publicChecks.length, sourcePreserved: true }));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Kesalahan migrasi yang tidak diketahui.";
  console.error(`Migrasi aset Supabase gagal: ${message}`);
  process.exitCode = 1;
});
