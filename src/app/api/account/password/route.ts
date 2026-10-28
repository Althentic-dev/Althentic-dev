// PUT /api/account/password - ganti password (session lain diturunkan, SPEC-05-03 pattern)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireUser, hashPassword, destroyAllSessions, createSession } from "@/lib/server/auth";

const schema = z.object({ password: z.string().min(8, "Password minimal 8 karakter.").max(128) });

export async function PUT(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak valid.", 422);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(parsed.data.password) },
    });
    await destroyAllSessions(user.id);
    await createSession(user.id, true); // session aktif dipertahankan
    return json({ ok: true });
  });
}
