// GET /api/seller/orders — daftar order toko (SPEC-02-05: kolom + filter default
// "Menunggu Verifikasi + Booked"; badge counter Perlu Tindakan SPEC-04-07)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, handle, fail } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { publicFileUrl } from "@/lib/server/notifications";
import { verifyOrder, rejectOrder } from "@/lib/server/orders";

const actionSchema = z.object({
  orderId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  checklist: z.array(z.boolean()).length(3).optional(),
  reason: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req);
    const store = await db.store.findUnique({ where: { ownerId: user.id } });
    if (!store) return fail("Buka toko dulu.", 404);

    const sp = req.nextUrl.searchParams;
    const filter = sp.get("filter") || "action"; // default: Menunggu Verifikasi + Booked (SPEC-02-05)
    const where: Record<string, unknown> = { storeId: store.id };
    if (filter === "action") {
      where.status = "payment_submitted";
      where.verifyPath = { in: ["manual", "wa"] }; // antrian Perlu Tindakan
    } else if (filter === "verifying") {
      where.status = "payment_submitted";
    } else if (filter === "all") {
      /* semua */
    } else if (["pending_payment", "payment_submitted", "verified", "completed", "rejected", "cancelled", "expired"].includes(filter)) {
      where.status = filter;
    }

    const [orders, actionCount] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          product: { select: { title: true, slug: true, previewPathsJson: true } },
          buyer: { select: { name: true } },
          receipts: { orderBy: { createdAt: "desc" } },
          events: { orderBy: { createdAt: "asc" } },
        },
      }),
      db.order.count({
        where: { storeId: store.id, status: "payment_submitted", verifyPath: { in: ["manual", "wa"] } },
      }),
    ]);

    return json({
      orders: orders.map((o) => {
        const previews = JSON.parse(o.product.previewPathsJson || "[]") as string[];
        return {
          id: o.id,
          code: o.code,
          status: o.status,
          verifyPath: o.verifyPath,
          price: o.price,
          sellType: o.sellType,
          product: { title: o.product.title, slug: o.product.slug, preview: publicFileUrl(previews[0]) },
          // GAP-06: data buyer dibatasi — nama ter-mask, bukan data pribadi lengkap
          buyerName: o.buyer.name.split(" ")[0] + " " + (o.buyer.name.split(" ")[1]?.[0] ?? "") + ".",
          createdAt: o.createdAt.toISOString(),
          expiresAt: o.expiresAt?.toISOString() ?? null,
          latestReceipt: o.receipts[0]
            ? {
                id: o.receipts[0].id,
                amount: o.receipts[0].amount,
                senderName: o.receipts[0].senderName,
                transferAt: o.receipts[0].transferAt?.toISOString() ?? null,
                matchStatus: o.receipts[0].matchStatus,
                manipulationSuspected: o.receipts[0].manipulationSuspected,
                receiptUrl: o.receipts[0].filePath ? `/api/seller/orders/${o.id}/receipt-preview` : null,
              }
            : null,
          events: o.events.map((e) => ({ id: e.id, label: e.label, status: e.status, actor: e.actor, note: e.note, createdAt: e.createdAt.toISOString() })),
        };
      }),
      actionCount, // badge counter menonjol (SPEC-04-07)
    });
  });
}

// POST — approve manual dengan 3 checklist wajib (SPEC-02-06) atau reject dengan alasan

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req);
    const store = await db.store.findUnique({ where: { ownerId: user.id } });
    if (!store) return fail("Buka toko dulu.", 404);
    const parsed = actionSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Input tidak valid.", 422);
    const { orderId, action, checklist, reason } = parsed.data;

    const order = await db.order.findUnique({ where: { id: orderId }, include: { store: true } });
    if (!order || order.storeId !== store.id) return fail("Order tidak ditemukan di tokomu.", 404);
    if (order.status !== "payment_submitted") return fail("Order tidak menunggu aksi manual.", 400);

    if (action === "approve") {
      // Checklist 3 item wajib dicentang sebelum Approve aktif (SPEC-02-06)
      if (!checklist || !checklist.every(Boolean)) {
        return fail("Centang 3 checklist wajib: nominal sesuai, nama/nomor pengirim terbaca, waktu transfer masuk akal.", 422, "CHECKLIST_REQUIRED");
      }
      await verifyOrder({ orderId, actor: "seller", checklist, note: "Verifikasi manual seller (3 checklist)" });
      return json({ ok: true, message: "Order disetujui — buyer dapat mengakses file." });
    }
    await rejectOrder({
      orderId,
      reason: reason || "Bukti tidak lolos verifikasi manual seller.",
      actor: "seller",
    });
    return json({ ok: true, message: "Order ditolak — buyer dapat mengunggah bukti baru." });
  });
}
