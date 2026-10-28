// POST /api/auth/forgot-password - email link reset sekali-pakai 1 jam (SPEC-05-03)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle, getClientIp } from "@/lib/server/helpers";
import { generateToken, hashToken } from "@/lib/server/auth";
import { sendEmail } from "@/lib/server/email";
import { rateLimit, rateLimitKey } from "@/lib/server/rate-limit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  return handle(async () => {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Email tidak valid.", 422);
    const ip = getClientIp(req);
    const rl = rateLimit(rateLimitKey(ip, null, "forgot"));
    if (!rl.ok) return fail("Terlalu banyak permintaan. Coba lagi nanti.", 429);

    const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    let devToken: string | undefined;
    // Jangan bocorkan keberadaan akun (enumeration protection)
    if (user && !user.softDeletedAt) {
      const token = generateToken();
      await db.verificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          purpose: "password_reset",
          expiresAt: new Date(Date.now() + 3600 * 1000), // 1 jam
        },
      });
      await sendEmail({
        to: user.email,
        subject: "Reset password Althentic.Dev",
        body: `Halo ${user.name},\n\nTautan reset password sekali-pakai (berlaku 1 jam):\n/?v=reset&token=${token}\n\nSetelah reset, semua session lama akan diturunkan.`,
        kind: "password_reset",
      });
      if (process.env.NODE_ENV !== "production") devToken = token;
    }
    return json({
      ok: true,
      message: "Jika email terdaftar, tautan reset telah dikirim.",
      devResetToken: devToken,
    });
  });
}
