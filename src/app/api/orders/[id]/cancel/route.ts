// POST /api/orders/[id]/cancel — buyer batalkan 1 klik sebelum Lunas (SPEC-04-08, GAP-01)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { cancelOrder } from "@/lib/server/orders";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const order = await db.order.findUnique({ where: { id }, select: { buyerId: true } });
    if (!order) return fail("Order tidak ditemukan.", 404);
    if (order.buyerId !== user.id) return fail("Bukan order milikmu.", 403);
    await cancelOrder(id, "Dibatalkan oleh buyer");
    return json({ ok: true });
  });
}
