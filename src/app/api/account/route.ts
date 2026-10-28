// PUT  /api/account - ubah nama & preferensi (SPEC-05-06, SPEC-13-03)
// DELETE - soft-delete 30 hari (GAP-17)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireUser, destroyAllSessions } from "@/lib/server/auth";

const schema = z.object({
  name: z.string().min(2).max(80).optional(),
  emailLang: z.enum(["id", "en"]).optional(),
  promoEmails: z.boolean().optional(),
  themePref: z.enum(["dark", "light", "system"]).optional(),
});

export async function PUT(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Input tidak valid.", 422);
    await db.user.update({ where: { id: user.id }, data: parsed.data });
    return json({ ok: true });
  });
}

export async function DELETE(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    await db.user.update({ where: { id: user.id }, data: { softDeletedAt: new Date() } });
    await destroyAllSessions(user.id);
    return json({ ok: true, message: "Akun dinonaktifkan - masuk dalam 30 hari untuk membatalkan." });
  });
}
