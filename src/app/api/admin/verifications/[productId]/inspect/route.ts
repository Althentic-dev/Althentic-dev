// POST /api/admin/verifications/[productId]/inspect — jalankan inspeksi ulang
// (re-inspeksi mingguan SPEC-11-01 / link_change SPEC-11-05)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireSuperAdmin } from "@/lib/server/auth";
import { runInspection } from "@/lib/server/inspection";

export async function POST(req: NextRequest, ctx: { params: Promise<{ productId: string }> }) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const { productId } = await ctx.params;
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return fail("Produk tidak ditemukan.", 404);
    const outcome = await runInspection({
      productId,
      trigger: product.status === "active" ? "reinspection" : "submission",
    });
    return json({ ok: true, ...outcome });
  });
}
