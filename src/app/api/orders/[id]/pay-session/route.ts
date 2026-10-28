// POST /api/orders/[id]/pay-session — buyer menekan "Bayar Sekarang" (SPEC-07-02:
// jendela bukti dimulai; QR seller ditampilkan)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { startPaySession } from "@/lib/server/orders";
import { signedFileUrl } from "@/lib/server/notifications";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const order = await db.order.findUnique({
      where: { id },
      select: { buyerId: true, status: true },
    });
    if (!order) return fail("Order tidak ditemukan.", 404);
    if (order.buyerId !== user.id) return fail("Bukan order milikmu.", 403);
    if (order.status !== "pending_payment" && order.status !== "rejected") {
      return fail("Sesi bayar hanya untuk order Menunggu Pembayaran.", 400);
    }
    await startPaySession(id);
    const updated = await db.order.findUnique({
      where: { id },
      include: { store: { select: { qrPath: true } } },
    });
    return json({
      ok: true,
      paySessionStartedAt: updated?.paySessionStartedAt?.toISOString(),
      qrUrl: updated?.store.qrPath ? signedFileUrl(updated.store.qrPath) : null,
    });
  });
}
