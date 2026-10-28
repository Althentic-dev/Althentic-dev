// POST /api/reviews/[id]/reply - balasan seller satu kali, publik (SPEC-10-06)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";

const schema = z.object({ reply: z.string().min(2).max(600) });

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Balasan minimal 2 karakter.", 422);

    const review = await db.review.findUnique({
      where: { id },
      include: { product: { include: { store: true } } },
    });
    if (!review) return fail("Review tidak ditemukan.", 404);
    if (review.product.store.ownerId !== user.id && !user.isSuperAdmin) {
      return fail("Hanya pemilik toko yang bisa membalas.", 403);
    }
    if (review.replyText) return fail("Review ini sudah dibalas (satu kali saja).", 409);

    await db.review.update({
      where: { id },
      data: { replyText: parsed.data.reply, repliedAt: new Date() },
    });
    return json({ ok: true });
  });
}
