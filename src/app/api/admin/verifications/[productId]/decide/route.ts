// POST /api/admin/verifications/[productId]/decide — keputusan final Super-Admin
// (SPEC-08-05: approve/reject + alasan; moderasi legalitas & keamanan — GAP-07)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireSuperAdmin } from "@/lib/server/auth";
import { decideVerification } from "@/lib/server/inspection";

const schema = z.object({
  decision: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ productId: string }> }) {
  return handle(async () => {
    const admin = await requireSuperAdmin(req);
    const { productId } = await ctx.params;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Keputusan tidak valid.", 422);
    if (parsed.data.decision === "reject" && !parsed.data.reason) {
      return fail("Alasan reject wajib diisi.", 422);
    }
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return fail("Produk tidak ditemukan.", 404);
    if (product.status !== "pending_verification") {
      return fail("Produk tidak dalam antrean verifikasi.", 400);
    }
    await decideVerification({
      productId,
      decision: parsed.data.decision,
      reason: parsed.data.reason,
      superAdminId: admin.id,
    });
    return json({ ok: true });
  });
}
