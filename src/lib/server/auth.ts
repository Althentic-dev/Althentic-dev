// =============================================================================
// Althentic.Dev - Auth (GAP-17)
// Sandbox: session custom (httpOnly cookie + DB) mengimplementasikan perilaku
// NextAuth (email/password + Google merge-ready) - lihat TECHNICAL_DECISIONS.md.
// Password: scrypt (node:crypto). Token reset/verify disimpan ter-hash (SPEC-05-03).
// Session: 30 hari dengan "Ingat saya", 1 hari tanpa (SPEC-05-07).
// =============================================================================

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/types";
import { getServerSecret } from "@/lib/server/secrets";

export const SESSION_COOKIE = "althentic_session";

function sessionSecret(): string {
  return getServerSecret("AUTH_SECRET", "dev-secret");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token + sessionSecret()).digest("hex");
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function isSuperAdminEmail(email: string): boolean {
  const admin = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  return !!admin && email.toLowerCase() === admin;
}

// ---------- Session ----------

export async function createSession(
  userId: string,
  remember: boolean,
  ip?: string,
  userAgent?: string
): Promise<string> {
  const token = generateToken();
  const maxAgeSec = remember ? 30 * 24 * 3600 : 24 * 3600; // SPEC-05-07
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      remember,
      expiresAt: new Date(Date.now() + maxAgeSec * 1000),
      ip,
      userAgent,
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSec,
  });
  return token;
}

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}

/** Ambil user dari session cookie - dipanggil DI DALAM route (SPEC-15-04). */
export async function getSessionUser(req?: Request): Promise<SessionUser | null> {
  let token: string | undefined;
  try {
    const jar = await cookies();
    token = jar.get(SESSION_COOKIE)?.value;
  } catch {
    token = undefined;
  }
  if (req && !token) {
    const bearer = req.headers.get("authorization");
    if (bearer?.startsWith("Bearer ")) token = bearer.slice(7);
  }
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  const u = session.user;
  if (u.softDeletedAt) return null;

  const store = await db.store.findUnique({
    where: { ownerId: u.id },
    select: { slug: true, status: true },
  });

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: store ? "seller" : "buyer",
    isSuperAdmin: u.isSuperAdmin || isSuperAdminEmail(u.email),
    emailVerified: !!u.emailVerifiedAt,
    hasStore: !!store,
    storeSlug: store?.slug,
    storeStatus: store?.status,
    themePref: u.themePref,
  };
}

export async function requireUser(req?: Request): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user) {
    throw Object.assign(new Error("Silakan masuk terlebih dahulu."), { status: 401 });
  }
  return user;
}

export async function requireSuperAdmin(req?: Request): Promise<SessionUser> {
  const user = await requireUser(req);
  if (!user.isSuperAdmin) {
    throw Object.assign(new Error("Akses khusus Super-Admin."), { status: 403 });
  }
  return user;
}

export async function requireVerifiedUser(req?: Request): Promise<SessionUser> {
  const user = await requireUser(req);
  if (!user.emailVerified) {
    throw Object.assign(
      new Error("Verifikasi email Anda dulu sebelum checkout pertama."),
      { status: 403, code: "EMAIL_NOT_VERIFIED" }
    );
  }
  return user;
}
