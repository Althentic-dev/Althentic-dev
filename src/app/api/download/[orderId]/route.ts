// GET /api/download/[orderId] - Delivery proxy/stream (GAP-02 FINAL):
// stream file .zip dari Google Drive dengan Content-Disposition: attachment.
// BUKAN redirect, BUKAN 302. Link Drive tidak pernah tampil mentah (SPEC-11-02).
// Kuota 1x terpakai saat stream DIMULAI (GAP-13). Setiap akses dicatat.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fail, handle, getClientIp, getUserAgent } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { deliverForOrder } from "@/lib/server/delivery";
import { finishDownloadLog, markDownloadUsed, restoreDownloadClaim } from "@/lib/server/orders";

export const maxDuration = 60;

function trackDownloadStream(
  body: ReadableStream<Uint8Array> | Buffer,
  p: { orderId: string; userId: string; claimedAt: Date }
): ReadableStream<Uint8Array> {
  const source = body instanceof ReadableStream
    ? body
    : new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(body));
          controller.close();
        },
      });
  const reader = source.getReader();
  let finalized = false;
  let bytesDelivered = 0;
  const finalize = async (status: "completed" | "failed") => {
    if (finalized) return;
    finalized = true;
    if (status === "failed" && bytesDelivered === 0) {
      await restoreDownloadClaim(p);
      return;
    }
    await finishDownloadLog({ ...p, status });
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await reader.read();
        if (chunk.done) {
          await finalize("completed").catch(() => undefined);
          controller.close();
        } else {
          bytesDelivered += chunk.value.byteLength;
          controller.enqueue(chunk.value);
        }
      } catch (error) {
        await finalize("failed").catch(() => undefined);
        controller.error(error);
      }
    },
    async cancel(reason) {
      await reader.cancel(reason).catch(() => undefined);
      await finalize("failed").catch(() => undefined);
    },
  });
}

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

    const claimedAt = await markDownloadUsed({
      orderId: order.id,
      userId: user.id,
      actor: user.isSuperAdmin ? "superadmin" : "buyer",
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    });
    if (!claimedAt) return fail("Kuota unduh sudah digunakan oleh request lain.", 403, "QUOTA_USED");

    let delivery;
    try {
      delivery = await deliverForOrder({ orderId: order.id });
    } catch (error) {
      await restoreDownloadClaim({ orderId: order.id, userId: user.id, claimedAt });
      throw error;
    }
    if (!delivery) {
      await restoreDownloadClaim({ orderId: order.id, userId: user.id, claimedAt });
      return fail("File produk tidak dapat diakses saat ini. Silakan ajukan dispute.", 502);
    }

    // Response: stream + attachment - TANPA redirect ke Google Drive (GAP-02)
    const headers = new Headers({
      "Content-Type": delivery.contentType,
      "Content-Disposition": `attachment; filename="${delivery.fileName}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    if (delivery.contentLength) {
      headers.set("Content-Length", String(delivery.contentLength));
    }
    return new Response(trackDownloadStream(delivery.body, {
      orderId: order.id,
      userId: user.id,
      claimedAt,
    }), { headers });
  });
  return response as Response;
}
