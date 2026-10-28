import { lookup as dnsLookup } from "node:dns/promises";
import type { LookupFunction } from "node:dns";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { Readable, Transform } from "node:stream";

type ResolvedAddress = { address: string; family: number };

async function lookupWithTimeout(hostname: string, timeoutMs = 5_000): Promise<ResolvedAddress[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      dnsLookup(hostname, { all: true, verbatim: true }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Resolusi DNS inspeksi timeout.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface SafeFetchResult {
  status: number;
  headers: import("node:http").IncomingHttpHeaders;
  body: Buffer;
  url: URL;
}

export interface SafeFetchStreamResult {
  status: number;
  headers: import("node:http").IncomingHttpHeaders;
  body: ReadableStream<Uint8Array>;
  url: URL;
}

function isPublicIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = parts;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 168 || (b === 0 && c <= 2) || (b === 88 && c === 99))) return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

function isPublicIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice(7);
    if (mapped.includes(".")) return isPublicIpv4(mapped);
    const hex = mapped.split(":");
    if (hex.length === 2) {
      const high = Number.parseInt(hex[0], 16);
      const low = Number.parseInt(hex[1], 16);
      return isPublicIpv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
    }
    return false;
  }
  const firstBlock = Number.parseInt(normalized.split(":")[0] || "0", 16);
  if (firstBlock < 0x2000 || firstBlock > 0x3fff) return false;
  if (firstBlock === 0x3fff || normalized.startsWith("2001:db8:") || normalized.startsWith("2002:") || normalized.startsWith("2001:0:")) return false;
  return true;
}

function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  return family === 4 ? isPublicIpv4(address) : family === 6 ? isPublicIpv6(address) : false;
}

async function resolvePublicAddresses(url: URL, dnsTimeoutMs = 5_000): Promise<ResolvedAddress[]> {
  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Hanya URL HTTP(S) yang diizinkan.");
  if (url.username || url.password) throw new Error("URL dengan kredensial tidak diizinkan.");
  if (url.port && !((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443"))) {
    throw new Error("Port URL tidak diizinkan.");
  }
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Host lokal tidak diizinkan.");
  }

  const family = isIP(hostname);
  const addresses = family
    ? [{ address: hostname, family }]
    : hostname.includes(".")
      ? await lookupWithTimeout(hostname, dnsTimeoutMs)
      : [];
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("URL inspeksi harus mengarah ke alamat IP publik.");
  }
  return addresses;
}

function requestPinned(url: URL, addresses: ResolvedAddress[], maxBytes: number, timeoutMs: number): Promise<SafeFetchResult> {
  const request = url.protocol === "https:" ? httpsRequest : httpRequest;
  const pinnedLookup = ((
    _hostname: string,
    options: { all?: boolean },
    callback: (error: NodeJS.ErrnoException | null, address: string | ResolvedAddress[], family?: number) => void
  ) => {
    if (options.all) callback(null, addresses);
    else callback(null, addresses[0].address, addresses[0].family);
  }) as unknown as LookupFunction;

  return new Promise((resolve, reject) => {
    const req = request(url, {
      method: "GET",
      headers: { "User-Agent": "AlthenticInspection/1.0" },
      lookup: pinnedLookup,
      timeout: timeoutMs,
    }, (res) => {
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (chunk: Buffer | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > maxBytes) {
          req.destroy(new Error("Respons inspeksi melebihi batas ukuran."));
          return;
        }
        chunks.push(buffer);
      });
      res.on("end", () => resolve({
        status: res.statusCode ?? 0,
        headers: res.headers,
        body: Buffer.concat(chunks, size),
        url,
      }));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("Request inspeksi timeout.")));
    req.on("error", reject);
    req.end();
  });
}

function requestPinnedStream(
  url: URL,
  addresses: ResolvedAddress[],
  maxBytes: number,
  timeoutMs: number,
  maxDurationMs: number
): Promise<SafeFetchStreamResult> {
  const request = url.protocol === "https:" ? httpsRequest : httpRequest;
  const pinnedLookup = ((
    _hostname: string,
    options: { all?: boolean },
    callback: (error: NodeJS.ErrnoException | null, address: string | ResolvedAddress[], family?: number) => void
  ) => {
    if (options.all) callback(null, addresses);
    else callback(null, addresses[0].address, addresses[0].family);
  }) as unknown as LookupFunction;

  return new Promise((resolve, reject) => {
    let totalTimer: ReturnType<typeof setTimeout> | undefined;
    const clearTotalTimer = () => {
      if (totalTimer) clearTimeout(totalTimer);
    };
    const req = request(url, {
      method: "GET",
      headers: { "User-Agent": "AlthenticDelivery/1.0" },
      lookup: pinnedLookup,
      timeout: timeoutMs,
    }, (res) => {
      const contentLength = Number(res.headers["content-length"]);
      if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        res.destroy();
        clearTotalTimer();
        reject(new Error("File delivery melebihi batas ukuran."));
        return;
      }

      let size = 0;
      const limiter = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          size += chunk.length;
          if (size > maxBytes) {
            const error = new Error("File delivery melebihi batas ukuran.");
            res.destroy(error);
            callback(error);
            return;
          }
          callback(null, chunk);
        },
      });
      res.on("end", clearTotalTimer);
      res.on("error", (error) => limiter.destroy(error));
      limiter.on("close", () => {
        clearTotalTimer();
        if (!res.complete && !res.destroyed) res.destroy();
      });
      res.pipe(limiter);
      resolve({
        status: res.statusCode ?? 0,
        headers: res.headers,
        body: Readable.toWeb(limiter) as ReadableStream<Uint8Array>,
        url,
      });
    });
    totalTimer = setTimeout(() => req.destroy(new Error("Durasi total request delivery terlampaui.")), maxDurationMs);
    req.on("timeout", () => req.destroy(new Error("Request delivery timeout.")));
    req.on("error", (error) => {
      clearTotalTimer();
      reject(error);
    });
    req.end();
  });
}

export async function safeFetchPublic(
  input: string,
  options: { maxBytes: number; timeoutMs: number; maxRedirects?: number }
): Promise<SafeFetchResult> {
  let current = new URL(input);
  const maxRedirects = options.maxRedirects ?? 3;

  for (let redirects = 0; ; redirects++) {
    const addresses = await resolvePublicAddresses(current);
    const response = await requestPinned(current, addresses, options.maxBytes, options.timeoutMs);
    const location = response.headers.location;
    const isRedirect = [301, 302, 303, 307, 308].includes(response.status);
    if (!isRedirect || !location) return response;
    if (redirects >= maxRedirects) throw new Error("Batas redirect inspeksi terlampaui.");

    const next = new URL(location, current);
    if (current.protocol === "https:" && next.protocol !== "https:") {
      throw new Error("Redirect HTTPS ke HTTP tidak diizinkan.");
    }
    current = next;
  }
}

export async function safeFetchPublicStream(
  input: string,
  options: { maxBytes: number; timeoutMs: number; maxDurationMs?: number; maxRedirects?: number }
): Promise<SafeFetchStreamResult> {
  let current = new URL(input);
  const maxRedirects = options.maxRedirects ?? 3;
  const deadline = Date.now() + (options.maxDurationMs ?? 55_000);

  for (let redirects = 0; ; redirects++) {
    const beforeLookupMs = deadline - Date.now();
    if (beforeLookupMs <= 0) throw new Error("Durasi total request delivery terlampaui.");
    const addresses = await resolvePublicAddresses(current, Math.min(5_000, beforeLookupMs));
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) throw new Error("Durasi total request delivery terlampaui.");
    const response = await requestPinnedStream(current, addresses, options.maxBytes, options.timeoutMs, remainingMs);
    const location = response.headers.location;
    const isRedirect = [301, 302, 303, 307, 308].includes(response.status);
    if (!isRedirect || !location) return response;
    await response.body.cancel().catch(() => undefined);
    if (redirects >= maxRedirects) throw new Error("Batas redirect delivery terlampaui.");

    const next = new URL(location, current);
    if (current.protocol === "https:" && next.protocol !== "https:") {
      throw new Error("Redirect HTTPS ke HTTP tidak diizinkan.");
    }
    current = next;
  }
}
