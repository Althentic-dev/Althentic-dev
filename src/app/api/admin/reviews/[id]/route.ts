// DELETE /api/admin/reviews/[id] - hapus review melanggar dengan alasan tercatat
// (SPEC-10-06: hanya Super-Admin). POST /api/admin/takedown - takedown produk
// dengan alasan terstruktur (SPEC-10-02) + email ke seller.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireSuperAdmin } from "@/lib/server/auth";
import { notifyUser } from "@/lib/server/notifications";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as { reason?: string } | null;
    if (!body?.reason) return fail("Alasan penghapusan wajib dicatat (SPEC-10-06).", 422);
    const review = await db.review.findUnique({ where: { id } });
    if (!review) return fail("Review tidak ditemukan.", 404);
    await db.review.update({
      where: { id },
      data: { deletedAt: new Date(), deleteReason: body.reason },
    });
    // Refresh rating produk
    const reviews = await db.review.findMany({
      where: { productId: review.productId, deletedAt: null },
      select: { rating: true, flagged: true },
    });
    const valid = reviews.filter((r) => !r.flagged);
    const avg = valid.length ? valid.reduce((a, r) => a + r.rating, 0) / valid.length : 0;
    await db.product.update({
      where: { id: review.productId },
      data: { ratingAvg: Math.round(avg * 10) / 10, ratingCount: valid.length },
    });
    return json({ ok: true });
  });
}

// Takedown produk (SPEC-10-02): wajib alasan terstruktur, seller dapat banding via dispute
export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const body = (await req.json().catch(() => null)) as {
      productId?: string;
      reason?: string;
      rule?: string;
    } | null;
    if (!body?.productId || !body.reason) return fail("Produk dan alasan wajib.", 422);
    const product = await db.product.findUnique({
      where: { id: body.productId },
      include: { store: { include: { owner: true } } },
    });
    if (!product) return fail("Produk tidak ditemukan.", 404);

    await db.product.update({
      where: { id: product.id },
      data: { status: "unlisted", rejectedReason: `[TAKEDOWN] ${body.rule ?? "Kebijakan konten"}: ${body.reason}` },
    });
    await db.auditLog.create({
      data: {
        actorType: "superadmin",
        action: "takedown",
        productId: product.id,
        payloadJson: JSON.stringify({ title: product.title, rule: body.rule ?? "-" }),
        decision: "takedown",
        reason: body.reason,
      },
    });
    await notifyUser({
      userId: product.store.ownerId,
      type: "verification_result",
      title: `Produk di-takedown: ${product.title}`,
      body: `${body.rule ?? "Kebijakan konten"}: ${body.reason} - kamu bisa mengajukan banding lewat jalur dispute.`,
      linkQuery: `v=dashboard&tab=products`,
      email: {
        to: product.store.owner.email,
        subject: `Takedown produk: ${product.title}`,
        body: `Halo ${product.store.name},\n\nProduk "${product.title}" telah di-takedown.\nAlasan terstruktur: ${body.rule ?? "Kebijakan konten"} - ${body.reason}\n\nKamu dapat mengajukan banding melalui jalur dispute.`,
        kind: "product_takedown",
      },
    });
    return json({ ok: true });
  });
}
