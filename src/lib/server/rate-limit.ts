// =============================================================================
// Althentic.Dev - Rate limiting (SPEC-15-03, GAP-19: 10 req/menit per IP+user)
// Sliding window. Sandbox: backend in-memory (per-proses).
// Production: ganti ke Upstash Redis REST dengan kontrak sama (1 file, SPEC-16-04).
// =============================================================================

type Hit = { t: number };

const buckets = new Map<string, Hit[]>();
const RATE_LIMIT = 10; // request per menit
const WINDOW_MS = 60_000;

export function rateLimit(
  key: string,
  limit = RATE_LIMIT,
  windowMs = WINDOW_MS
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((h) => now - h.t < windowMs);
  if (arr.length >= limit) {
    const oldest = arr[0].t;
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }
  arr.push({ t: now });
  buckets.set(key, arr);
  // GC ringan
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((h) => now - h.t > windowMs)) buckets.delete(k);
    }
  }
  return { ok: true };
}

export function rateLimitKey(ip: string, userId?: string | null, scope = "default") {
  return `${scope}:${ip}:${userId ?? "anon"}`;
}
