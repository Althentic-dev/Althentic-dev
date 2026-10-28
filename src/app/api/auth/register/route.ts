// POST /api/auth/register - pendaftaran (SPEC-05-01, SPEC-14-03/05)
// Checkbox ToS + usia 17+ wajib; versi & tanggal consent dicatat.
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle, getClientIp, getUserAgent } from "@/lib/server/helpers";
import { hashPassword, generateToken, hashToken, isSuperAdminEmail, createSession } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/settings";
import { notifyUser } from "@/lib/server/notifications";
import { rateLimit, rateLimitKey } from "@/lib/server/rate-limit";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter.").max(80),
  email: z.string().email("Email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter.").max(128),
  remember: z.boolean().optional().default(true),
  tosAgreed: z.literal(true, { message: "Kamu harus menyetujui Syarat & Ketentuan." }),
  ageAgreed: z.literal(true, { message: "Kamu harus menyatakan berusia minimal 17 tahun." }),
});

export async function POST(req: NextRequest) {
  return handle(async () => {
    const ip = getClientIp(req);
    const rl = rateLimit(rateLimitKey(ip, null, "register"));
    if (!rl.ok) return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Input tidak valid.", 422);
    }
    const { name, email, password, remember, tosAgreed, ageAgreed } = parsed.data;
    void tosAgreed; void ageAgreed;
    const emailNorm = email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email: emailNorm } });
    if (existing && existing.passwordHash) {
      return fail("Email sudah terdaftar. Silakan masuk atau reset password.", 409, "EMAIL_EXISTS");
    }

    const settings = await getSettings();

    let user;
    if (existing) {
      // GAP-17: akun Google (placeholder) & email/password dengan email sama → digabung
      user = await db.user.update({
        where: { id: existing.id },
        data: { name: existing.name || name, passwordHash: hashPassword(password) },
      });
    } else {
      user = await db.user.create({
        data: {
          email: emailNorm,
          name,
          passwordHash: hashPassword(password),
          isSuperAdmin: isSuperAdminEmail(emailNorm),
          tosVersion: settings.tosVersion,
          tosConsentedAt: new Date(),
          ageConfirmedAt: new Date(),
          lastLoginIp: ip,
        },
      });
    }

    // Token verifikasi email - kedaluwarsa 24 jam (SPEC-05-02)
    const token = generateToken();
    await db.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        purpose: "email_verify",
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    await notifyUser({
      userId: user.id,
      type: "system",
      title: "Selamat datang di Althentic.Dev",
      body: "Verifikasi email kamu untuk membuka checkout pertama.",
      linkQuery: "v=settings",
      email: {
        to: user.email,
        subject: "Verifikasi email Althentic.Dev",
        body: `Halo ${user.name},\n\nKlik tautan berikut untuk memverifikasi email kamu (berlaku 24 jam):\n/?v=verify&token=${token}\n\nJika kamu tidak mendaftar, abaikan email ini.`,
        kind: "email_verification",
      },
    });

    await createSession(user.id, remember ?? true, ip, getUserAgent(req));

    return json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: "buyer",
        isSuperAdmin: user.isSuperAdmin,
        emailVerified: !!user.emailVerifiedAt,
        hasStore: false,
      },
      // Sandbox: tautan verifikasi dikembalikan agar alur dapat diuji tanpa SMTP
      devVerifyToken: process.env.NODE_ENV === "production" ? undefined : token,
    });
  });
}
