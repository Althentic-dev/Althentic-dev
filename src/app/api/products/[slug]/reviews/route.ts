// POST /api/products/[slug]/reviews — review buyer order Lunas (SPEC-10-05)
// PUT — edit dalam 7 hari pertama.
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { REVIEW_EDIT_WINDOW_DAYS } from "@/lib/constants";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(4, "Review minimal 4 karakter.").max(1000),
});

async function refreshProductRating(productId: string) {
  const reviews = await db.review.findMany({
    where: { productId, deletedAt: null },
    select: { rating: true, flagged: true },
  });
  const valid = reviews.filter((r) => !r.flagged); // rating self-buy diflag → tidak dihitung (SPEC-16-12)
  const avg = valid.length ? valid.reduce((a, r) => a + r.rating, 0) / valid.length : 0;
  await db.product.update({
    where: { id: productId },
    data: { ratingAvg: Math.round(avg * 10) / 10, ratingCount: valid.length },
  });
  // Agregat rating toko
  const products = await db.product.findMany({
    where: { storeId: (await db.product.findUnique({ where: { id: productId }, select: { storeId: true } }))!.storeId },
    select: { ratingAvg: true, ratingCount: true },
  });
  const total = products.reduce((a, p) => a + p.ratingCount, 0);
  const storeAvg = total ? products.reduce((a, p) => a + p.ratingAvg * p.ratingCount, 0) / total : 0;
  const storeId = (await db.product.findUnique({ where: { id: productId }, select: { storeId: true } }))!.storeId;
  await db.store.update({
    where: { id: storeId },
    data: { ratingAvg: Math.round(storeAvg * 10) / 10, ratingCount: total },
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { slug } = await ctx.params;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak valid.", 422);

    const product = await db.product.findUnique({ where: { slug } });
    if (!product) return fail("Produk tidak ditemukan.", 404);

    // Hanya buyer dengan order Lunas pada produk tsb; satu review per pembelian
    const order = await db.order.findFirst({
      where: { productId: product.id, buyerId: user.id, status: { in: ["verified", "completed"] } },
    });
    if (!order) return fail("Hanya buyer dengan order Lunas yang bisa mereview.", 403);
    const exists = await db.review.findFirst({ where: { orderId: order.id } });
    if (exists) return fail("Kamu sudah mereview pembelian ini.", 409);

    await db.review.create({
      data: {
        orderId: order.id,
        productId: product.id,
        userId: user.id,
        rating: parsed.data.rating,
        text: parsed.data.text,
        flagged: order.selfBuyFlag, // self-buy diflag (SPEC-16-12)
      },
    });
    await refreshProductRating(product.id);
    return json({ ok: true });
  });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { slug } = await ctx.params;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak valid.", 422);

    const review = await db.review.findFirst({
      where: { productId: (await db.product.findUnique({ where: { slug } }))?.id, userId: user.id },
    });
    if (!review) return fail("Review tidak ditemukan.", 404);
    // Edit hanya dalam 7 hari pertama (SPEC-10-05)
    if (Date.now() - review.createdAt.getTime() > REVIEW_EDIT_WINDOW_DAYS * 24 * 3600 * 1000) {
      return fail("Masa edit review (7 hari) sudah berakhir.", 403);
    }
    await db.review.update({
      where: { id: review.id },
      data: { rating: parsed.data.rating, text: parsed.data.text, editedAt: new Date() },
    });
    await refreshProductRating(review.productId);
    return json({ ok: true });
  });
}
