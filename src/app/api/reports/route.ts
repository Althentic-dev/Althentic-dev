// POST /api/reports — laporkan produk (SPEC-10-03: 5 kategori + detail opsional)
// POST /api/reports?dispute=1 — ajukan dispute (GAP-18: batas 7 hari setelah completed)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle, randomCode } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { DISPUTE_WINDOW_DAYS } from "@/lib/constants";

const reportSchema = z.object({
  productId: z.string().min(1),
  category: z.enum(["illegal", "plagiarism", "mismatch", "payment_fraud", "other"]),
  detail: z.string().max(600).optional(),
});

const disputeSchema = z.object({
  orderId: z.string().min(1).optional(),
  productId: z.string().min(1).optional(),
  title: z.string().min(5).max(120),
  body: z.string().min(10).max(2000),
  category: z.enum([
    "refund_inaccessible",
    "refund_mismatch",
    "no_response",
    "content_mismatch",
    "takedown_appeal",
    "other",
  ]),
});

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req);
    const isDispute = req.nextUrl.searchParams.get("dispute") === "1";

    if (!isDispute) {
      const parsed = reportSchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return fail("Kategori laporan tidak valid.", 422);
      const product = await db.product.findUnique({ where: { id: parsed.data.productId } });
      if (!product) return fail("Produk tidak ditemukan.", 404);
      await db.report.create({
        data: {
          productId: product.id,
          reporterId: user.id,
          category: parsed.data.category,
          detail: parsed.data.detail ?? null,
        },
      });
      return json({ ok: true, message: "Laporan terkirim — tim moderasi akan meninjau." }, 201);
    }

    // ---- Dispute (GAP-18) ----
    const parsed = disputeSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak valid.", 422);

    let orderId: string | null = null;
    let productId: string | null = parsed.data.productId ?? null;
    let againstStoreId: string | null = null;

    if (parsed.data.orderId) {
      const order = await db.order.findUnique({
        where: { id: parsed.data.orderId },
        include: { product: true },
      });
      if (!order) return fail("Order tidak ditemukan.", 404);
      if (order.buyerId !== user.id) return fail("Bukan order milikmu.", 403);
      // Batas pengajuan dispute: 7 hari setelah transaksi completed (GAP-18)
      if (order.status !== "completed" && order.status !== "verified") {
        return fail("Dispute hanya untuk order Lunas/Selesai.", 400);
      }
      const completedAt = order.completedAt ?? order.verifiedAt;
      if (
        completedAt &&
        Date.now() - completedAt.getTime() > DISPUTE_WINDOW_DAYS * 24 * 3600 * 1000
      ) {
        return fail(`Batas pengajuan dispute ${DISPUTE_WINDOW_DAYS} hari setelah transaksi selesai sudah terlewati.`, 403, "DISPUTE_WINDOW");
      }
      orderId = order.id;
      productId = order.productId;
      againstStoreId = order.storeId;
    }

    const dispute = await db.dispute.create({
      data: {
        code: randomCode("DSP"),
        orderId,
        productId,
        openedByUserId: user.id,
        openedByEmail: user.email,
        againstStoreId,
        title: parsed.data.title,
        body: parsed.data.body,
        category: parsed.data.category,
        status: "open",
      },
    });
    await db.disputeEvent.create({
      data: { disputeId: dispute.id, actor: "buyer", note: "Dispute dibuka. Komunikasi lanjutan di luar platform (Althentic sebagai mediator)." },
    });
    // Notifikasi ke Super-Admin
    const admin = await db.user.findFirst({ where: { isSuperAdmin: true } });
    if (admin) {
      const { notifyUser } = await import("@/lib/server/notifications");
      await notifyUser({
        userId: admin.id,
        type: "system",
        title: `Dispute baru: ${dispute.code}`,
        body: parsed.data.title,
        linkQuery: "v=admin&tab=disputes",
      });
    }
    return json({ ok: true, code: dispute.code }, 201);
  });
}
