// POST /api/auth/verify-email — verifikasi token 24 jam (SPEC-05-02)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { hashToken } from "@/lib/server/auth";

const schema = z.object({ token: z.string().min(10) });

export async function POST(req: NextRequest) {
  return handle(async () => {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Token tidak valid.", 422);

    const row = await db.verificationToken.findUnique({
      where: { tokenHash: hashToken(parsed.data.token) },
      include: { user: true },
    });
    if (!row || row.usedAt) return fail("Token tidak dikenali atau sudah dipakai.", 400);
    if (row.purpose !== "email_verify") return fail("Token tidak valid untuk verifikasi email.", 400);
    if (row.expiresAt < new Date()) return fail("Tautan kedaluwarsa (24 jam). Minta kirim ulang.", 410, "LINK_EXPIRED");

    await db.$transaction([
      db.verificationToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      db.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
    ]);
    return json({ ok: true, email: row.user.email });
  });
}
