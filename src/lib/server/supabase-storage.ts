import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type PublicAssetBucket = "banners" | "previews";

let cachedClient: SupabaseClient | undefined;

export const supabaseFetch: typeof fetch = Object.assign(
  (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const timeout = AbortSignal.timeout(15_000);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    return fetch(input, { ...init, signal });
  },
  {
    preconnect: (...args: Parameters<typeof fetch.preconnect>) => {
      if (typeof fetch.preconnect === "function") fetch.preconnect(...args);
    },
  }
);

function getClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const endpoint = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!endpoint || !serviceRoleKey) {
    throw new Error("Supabase Storage memerlukan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.");
  }

  let parsedEndpoint: URL;
  try {
    parsedEndpoint = new URL(endpoint);
  } catch {
    throw new Error("SUPABASE_URL tidak valid.");
  }
  if (parsedEndpoint.protocol !== "https:" || parsedEndpoint.username || parsedEndpoint.password) {
    throw new Error("SUPABASE_URL harus berupa endpoint HTTPS tanpa kredensial.");
  }

  cachedClient = createClient(endpoint, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: supabaseFetch },
  });
  return cachedClient;
}

function normalizeObjectPath(objectPath: string): string {
  const normalized = objectPath.replace(/\\/g, "/");
  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized.split("/").some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error("Path object storage tidak valid.");
  }
  return normalized;
}

export function resolvePublicAssetBucket(objectPath: string): PublicAssetBucket {
  const normalized = normalizeObjectPath(objectPath);
  if (normalized.startsWith("banners/") || normalized.startsWith("qr/")) return "banners";
  if (normalized.startsWith("products/")) return "previews";
  throw new Error("Prefix object publik tidak didukung oleh Supabase Storage.");
}

function getBucketName(bucket: PublicAssetBucket): string {
  const envName = bucket === "banners"
    ? "SUPABASE_STORAGE_BUCKET_BANNERS"
    : "SUPABASE_STORAGE_BUCKET_PREVIEWS";
  const name = process.env[envName];
  if (!name || !/^[a-z0-9][a-z0-9_-]{0,62}$/.test(name)) {
    throw new Error(`${envName} belum valid.`);
  }
  return name;
}

export async function putPublicAsset(
  objectPath: string,
  data: Buffer,
  contentType = "application/octet-stream"
): Promise<void> {
  const normalized = normalizeObjectPath(objectPath);
  const bucketName = getBucketName(resolvePublicAssetBucket(normalized));
  const { error } = await getClient().storage.from(bucketName).upload(normalized, data, {
    contentType,
    cacheControl: "86400",
    upsert: true,
  });
  if (error) throw new Error(`Supabase gagal mengunggah aset publik (${error.statusCode ?? "unknown"}).`);
}

export async function getPublicAsset(objectPath: string): Promise<Buffer | null> {
  const normalized = normalizeObjectPath(objectPath);
  const bucketName = getBucketName(resolvePublicAssetBucket(normalized));
  const { data, error } = await getClient().storage.from(bucketName).download(normalized);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function deletePublicAsset(objectPath: string): Promise<void> {
  const normalized = normalizeObjectPath(objectPath);
  const bucketName = getBucketName(resolvePublicAssetBucket(normalized));
  const { error } = await getClient().storage.from(bucketName).remove([normalized]);
  if (error) throw new Error(`Supabase gagal menghapus aset publik (${error.statusCode ?? "unknown"}).`);
}

export async function publicAssetExists(objectPath: string): Promise<boolean> {
  const normalized = normalizeObjectPath(objectPath);
  const bucketName = getBucketName(resolvePublicAssetBucket(normalized));
  const endpoint = new URL(process.env.SUPABASE_URL ?? "");
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) {
    throw new Error("SUPABASE_URL harus berupa endpoint HTTPS tanpa kredensial.");
  }
  const encodedPath = normalized.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(
    `${endpoint.origin}/storage/v1/object/public/${encodeURIComponent(bucketName)}/${encodedPath}`,
    { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(5000) }
  );
  if (response.status === 404) return false;
  if (!response.ok) {
    throw new Error(`Probe aset publik Supabase gagal (HTTP ${response.status}).`);
  }
  return true;
}
