// GET /api/download/[orderId] — Delivery proxy/stream (GAP-02 FINAL):
// stream file .zip dari Google Drive dengan Content-Disposition: attachment.
// BUKAN redirect, BUKAN 302. Link Drive tidak pernah tampil mentah (SPEC-11-02).
// Kuota 1x terpakai saat stream DIMULAI (GAP-13). Setiap akses dicatat.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fail, handle, getClientIp, getUserAgent } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { deliverForOrder } from "@/lib/server/delivery";
import { markDownloadUsed } from "@/lib/server/orders";

export async function GET(req: NextRequest, ctx: { params: Promise<{ orderId: string }> }) {
  const response = await handle(async () => {
    const user = await requireUser(req);
    const { orderId } = await ctx.params;
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return fail("Order tidak ditemukan.", 404);
    if (order.buyerId !== user.id && !user.isSuperAdmin) {
      return fail("Tidak berhak mengunduh file ini.", 403);
    }
    // Akses file hanya saat Lunas (SPEC-11-02)
    if (order.status !== "verified" && order.status !== "completed") {
      return fail("File hanya bisa diunduh setelah order Lunas.", 403);
    }
    // Kuota 1x tanpa kecuali tanpa reset (SPEC-11-03, GAP-13)
    if (order.downloadUsedAt) {
      return fail("Kuota unduh (1x) sudah terpakai untuk order ini. Ajukan dispute bila unduhan terputus.", 403, "QUOTA_USED");
    }

    const ip = getClientIp(req);
    // Catat akses SEBELUM stream dimulai (SPEC-11-02) + konsumsi kuota (GAP-13)
    await db.downloadLog.create({
      data: { orderId: order.id, userId: user.id, ip, userAgent: getUserAgent(req), status: "started" },
    });
    await markDownloadUsed(order.id); // kuota terpakai saat stream dimulai

    const delivery = await deliverForOrder({ orderId: order.id });
    if (!delivery) {
      await db.downloadLog.updateMany({
        where: { orderId: order.id, status: "started" },
        data: { status: "failed" },
      });
      return fail("File produk tidak dapat diakses saat ini. Silakan ajukan dispute.", 502);
    }

    // Response: stream + attachment — TANPA redirect ke Google Drive (GAP-02)
    const headers = new Headers({
      "Content-Type": delivery.contentType,
      "Content-Disposition": `attachment; filename="${delivery.fileName}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    if (delivery.contentLength) {
      headers.set("Content-Length", String(delivery.contentLength));
    }
    if (Buffer.isBuffer(delivery.body)) {
      return new Response(new Uint8Array(delivery.body), { headers });
    }
    return new Response(delivery.body, { headers });
  });
  return response as Response;
}
