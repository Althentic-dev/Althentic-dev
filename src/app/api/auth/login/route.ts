// POST /api/auth/login - SPEC-05-01 (email+password utama)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle, getClientIp, getUserAgent } from "@/lib/server/helpers";
import { verifyPassword, createSession } from "@/lib/server/auth";
import { rateLimit, rateLimitKey } from "@/lib/server/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  return handle(async () => {
    const ip = getClientIp(req);
    const rl = rateLimit(rateLimitKey(ip, null, "login"));
    if (!rl.ok) return fail("Terlalu banyak percobaan masuk. Tunggu sebentar.", 429);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Email atau password tidak valid.", 422);

    const user = await db.user.findUnique({
      where: { email: parsed.data.email.toLowerCase().trim() },
    });
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return fail("Email atau password salah.", 401);
    }
    if (user.softDeletedAt) {
      return fail("Akun ini sedang dalam masa penghapusan. Hubungi dukungan.", 403);
    }

    await createSession(user.id, parsed.data.remember ?? true, ip, getUserAgent(req));
    await db.user.update({ where: { id: user.id }, data: { lastLoginIp: ip } });

    const store = await db.store.findUnique({ where: { ownerId: user.id }, select: { slug: true, status: true } });
    return json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: store ? "seller" : "buyer",
        isSuperAdmin: user.isSuperAdmin,
        emailVerified: !!user.emailVerifiedAt,
        hasStore: !!store,
        storeSlug: store?.slug,
        storeStatus: store?.status,
      },
    });
  });
}
