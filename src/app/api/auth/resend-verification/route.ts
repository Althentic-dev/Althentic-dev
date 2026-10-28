// POST /api/auth/resend-verification - kirim ulang link verifikasi (SPEC-05-02)
import { handle, fail, json, getClientIp } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { generateToken, hashToken } from "@/lib/server/auth";
import { db } from "@/lib/db";
import { notifyUser } from "@/lib/server/notifications";
import { rateLimit, rateLimitKey } from "@/lib/server/rate-limit";

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    if (user.emailVerified) return fail("Email sudah terverifikasi.", 400);
    const ip = getClientIp(req);
    const rl = rateLimit(rateLimitKey(ip, user.id, "resend"));
    if (!rl.ok) return fail("Terlalu sering. Coba lagi nanti.", 429);

    const token = generateToken();
    await db.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        purpose: "email_verify",
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });
    const u = await db.user.findUnique({ where: { id: user.id } });
    await notifyUser({
      userId: user.id,
      type: "system",
      title: "Tautan verifikasi dikirim ulang",
      body: "Tautan baru berlaku 24 jam.",
      linkQuery: "v=settings",
      email: {
        to: user.email,
        subject: "Verifikasi email Althentic.Dev (tautan baru)",
        body: `Halo ${u?.name ?? user.name},\n\nTautan verifikasi baru (berlaku 24 jam):\n/?v=verify&token=${token}`,
        kind: "email_verification_resend",
      },
    });
    return json({ ok: true, devVerifyToken: process.env.NODE_ENV === "production" ? undefined : token });
  });
}
