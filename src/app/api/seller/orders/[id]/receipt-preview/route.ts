// GET /api/seller/orders/[id]/receipt-preview — bukti transfer via signed URL pendek
// (SPEC-07-06: bucket private, akses lewat signed URL dari API)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fail, handle, json } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { fileUrl } from "@/lib/server/storage";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const order = await db.order.findUnique({
      where: { id },
      include: { store: true, receipts: { orderBy: { createdAt: "desc" } } },
    });
    if (!order) return fail("Order tidak ditemukan.", 404);
    const isSeller = order.store.ownerId === user.id;
    if (!isSeller && !user.isSuperAdmin && order.buyerId !== user.id) {
      return fail("Tidak berhak mengakses bukti ini.", 403);
    }
    const receipt = order.receipts[0];
    if (!receipt?.filePath) return fail("Bukti tidak tersedia (retensi 30 hari / belum diunggah).", 404);
    const [bucket, ...rest] = receipt.filePath.split("/");
    return json({
      url: fileUrl(bucket === "private" ? "private" : "public", rest.join("/"), 600), // signed URL pendek
    });
  });
}
