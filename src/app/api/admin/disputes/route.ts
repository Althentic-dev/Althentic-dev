// GET  /api/admin/disputes — inbox sederhana Open/Investigating/Resolved (Konteks Terkunci)
// POST — ubah status + catatan; refund manual dicatat sebagai Resolved + teks (GAP-18)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireSuperAdmin } from "@/lib/server/auth";
import type { DisputeDTO } from "@/lib/types";

export async function GET(req: Request) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const disputes = await db.dispute.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        events: { orderBy: { createdAt: "asc" } },
        order: { include: { product: { select: { title: true } } } },
      },
    });
    const dtos: DisputeDTO[] = disputes.map((d) => ({
      id: d.id,
      code: d.code,
      title: d.title,
      body: d.body,
      category: d.category,
      status: d.status,
      openedByEmail: d.openedByEmail,
      orderCode: d.order?.code ?? null,
      order: d.order
        ? { id: d.order.id, code: d.order.code, price: d.order.price, productTitle: d.order.product.title }
        : null,
      resolutionNote: d.resolutionNote,
      createdAt: d.createdAt.toISOString(),
      resolvedAt: d.resolvedAt?.toISOString() ?? null,
      events: d.events.map((e) => ({ id: e.id, actor: e.actor, note: e.note, createdAt: e.createdAt.toISOString() })),
    }));
    return json({ disputes: dtos });
  });
}

const schema = z.object({
  disputeId: z.string().min(1),
  status: z.enum(["open", "investigating", "resolved"]),
  note: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  return handle(async () => {
    const admin = await requireSuperAdmin(req);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Input tidak valid.", 422);
    const { disputeId, status, note } = parsed.data;
    const dispute = await db.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) return fail("Dispute tidak ditemukan.", 404);
    if (status === "resolved" && !note) {
      return fail("Catatan resolusi wajib saat menutup dispute (refund manual dicatat sebagai teks — GAP-18).", 422);
    }
    await db.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        resolutionNote: status === "resolved" ? note ?? dispute.resolutionNote : dispute.resolutionNote,
        resolvedAt: status === "resolved" ? new Date() : null,
        resolvedBy: status === "resolved" ? admin.id : null,
      },
    });
    await db.disputeEvent.create({
      data: {
        disputeId,
        actor: "superadmin",
        note: note ?? `Status → ${status}. Komunikasi & refund tetap di luar sistem.`,
      },
    });
    return json({ ok: true });
  });
}
