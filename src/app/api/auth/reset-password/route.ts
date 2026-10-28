// POST /api/auth/reset-password — token ter-hash, sekali-pakai, session lama
// diturunkan (SPEC-05-03)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { hashToken, hashPassword, destroyAllSessions } from "@/lib/server/auth";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password baru minimal 8 karakter.").max(128),
});

export async function POST(req: NextRequest) {
  return handle(async () => {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak valid.", 422);

    const row = await db.verificationToken.findUnique({
      where: { tokenHash: hashToken(parsed.data.token) },
    });
    if (!row || row.usedAt || row.purpose !== "password_reset") {
      return fail("Token tidak dikenali atau sudah dipakai.", 400);
    }
    if (row.expiresAt < new Date()) return fail("Tautan reset kedaluwarsa (1 jam).", 410, "LINK_EXPIRED");

    await db.$transaction([
      db.verificationToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      db.user.update({
        where: { id: row.userId },
        data: { passwordHash: hashPassword(parsed.data.password) },
      }),
    ]);
    await destroyAllSessions(row.userId); // semua session lama diturunkan
    return json({ ok: true });
  });
}
