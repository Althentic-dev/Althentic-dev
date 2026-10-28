// POST /api/seller/products/[id]/submit - kirim produk untuk verifikasi (SPEC-08)
// Update link Drive saat produk aktif → verifikasi ulang singkat (SPEC-11-05)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { runInspection } from "@/lib/server/inspection";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const product = await db.product.findUnique({ where: { id }, include: { store: true } });
    if (!product) return fail("Produk tidak ditemukan.", 404);
    if (product.store.ownerId !== user.id) return fail("Bukan produk tokomu.", 403);
    if (!["draft", "rejected", "unlisted"].includes(product.status)) {
      return fail(`Produk berstatus ${product.status} - hanya draft/ditolak/di-unlist yang bisa dikirim.`, 400);
    }

    const outcome = await runInspection({
      productId: product.id,
      trigger: product.status === "rejected" ? "reinspection" : "submission",
    });
    return json({
      ok: true,
      autoRejected: outcome.autoRejected,
      reason: outcome.reason ?? null,
      message: outcome.autoRejected
        ? "Produk ditolak otomatis (SPEC-08-02) - perbaiki lalu kirim ulang (tenggat 14 hari)."
        : "Inspeksi teknis lolos - menunggu review Super-Admin (moderasi legalitas & keamanan).",
    });
  });
}
