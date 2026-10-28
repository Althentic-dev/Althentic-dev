// Althentic.Dev — util server (SPEC-15-04: error tanpa stack, Zod di route)

import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

export function getUserAgent(req: Request): string {
  return req.headers.get("user-agent") ?? "";
}

/** Wrapper handler API: tangkap error, log terstruktur (SPEC-15-05), jangan bocorkan stack. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string; code?: string };
    if (e?.status && e?.message) {
      return fail(e.message, e.status, e.code);
    }
    console.error(
      JSON.stringify({
        level: "error",
        time: new Date().toISOString(),
        message: e?.message ?? "unknown",
        stack: process.env.NODE_ENV === "production" ? undefined : (err as Error)?.stack,
      })
    );
    return fail("Terjadi kesalahan internal. Silakan coba lagi.", 500);
  }
}

// Validasi slug (GAP-17): lowercase alphanumeric+dash, 3-30 karakter, unique,
// larang reserved words.
const RESERVED_SLUGS = new Set([
  "admin", "api", "dashboard", "login", "register", "auth", "settings", "store",
  "toko", "catalog", "katalog", "docs", "dokumentasi", "generator", "status",
  "support", "help", "bantuan", "legal", "tos", "privacy", "root", "www", "mail",
  "app", "www2", "superadmin", "billing", "invoice", "commission", "owner",
  "althentic", "platform", "system", "null", "undefined", "test", "dev",
]);

export function validateSlug(slug: string): { ok: true } | { ok: false; error: string } {
  if (!/^[a-z0-9-]{3,30}$/.test(slug)) {
    return {
      ok: false,
      error: "Slug harus 3-30 karakter, hanya huruf kecil, angka, dan tanda hubung.",
    };
  }
  if (slug.startsWith("-") || slug.endsWith("-") || slug.includes("--")) {
    return { ok: false, error: "Slug tidak boleh diawali/diakhiri tanda hubung atau berganda." };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: "Slug ini dipesan sistem, silakan pilih yang lain." };
  }
  return { ok: true };
}

// Validasi nomor WhatsApp Indonesia (SPEC-04-03)
export function validateWhatsApp(input: string): { ok: true; normalized: string } | { ok: false; error: string } {
  const cleaned = input.replace(/[\s-]/g, "");
  const patterns = [/^08\d{8,11}$/, /^\+628\d{8,11}$/, /^628\d{8,11}$/];
  if (!patterns.some((p) => p.test(cleaned))) {
    return { ok: false, error: "Nomor WhatsApp tidak valid. Gunakan format Indonesia (mis. 08123456789)." };
  }
  let normalized = cleaned;
  if (normalized.startsWith("+62")) normalized = "62" + normalized.slice(3);
  else if (normalized.startsWith("0")) normalized = "62" + normalized.slice(1);
  return { ok: true, normalized };
}

export function randomCode(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${s}`;
}
