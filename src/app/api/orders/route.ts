// POST /api/orders — checkout (SPEC-04-01: wajib akun + verifikasi email pertama)
// GET  /api/orders — daftar order buyer (Pesanan Saya)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle, getClientIp } from "@/lib/server/helpers";
import { requireVerifiedUser, requireUser } from "@/lib/server/auth";
import { createOrder } from "@/lib/server/orders";
import { rateLimit, rateLimitKey } from "@/lib/server/rate-limit";
import { publicFileUrl, signedFileUrl } from "@/lib/server/notifications";
import { orderStatusLabel } from "@/lib/constants";
import type { OrderDTO } from "@/lib/types";

const schema = z.object({
  productId: z.string().min(1),
  sellType: z.enum(["template", "prompt", "bundle"]),
});

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireVerifiedUser(req); // verifikasi email sebelum checkout pertama
    const ip = getClientIp(req);
    const rl = rateLimit(rateLimitKey(ip, user.id, "checkout"));
    if (!rl.ok) return fail("Terlalu banyak order. Tunggu sebentar.", 429);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Produk atau tipe jual tidak valid.", 422);

    const order = await createOrder({
      buyerId: user.id,
      buyerEmail: user.email,
      buyerName: user.name,
      buyerIp: ip,
      productId: parsed.data.productId,
      sellType: parsed.data.sellType,
    });
    return json({ orderId: order.id, code: order.code }, 201);
  });
}

export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req);
    const orders = await db.order.findMany({
      where: { buyerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, title: true, slug: true, previewPathsJson: true, version: true } },
        store: { select: { id: true, name: true, slug: true, whatsapp: true } },
        events: { orderBy: { createdAt: "asc" } },
        receipts: { orderBy: { createdAt: "desc" } },
      },
    });

    const dtos: OrderDTO[] = orders.map((o) => {
      const previews = JSON.parse(o.product.previewPathsJson || "[]") as string[];
      return {
        id: o.id,
        code: o.code,
        status: o.status,
        verifyPath: o.verifyPath,
        price: o.price,
        sellType: o.sellType,
        product: {
          id: o.product.id,
          title: o.product.title,
          slug: o.product.slug,
          preview: publicFileUrl(previews[0]),
          version: o.product.version,
        },
        store: { id: o.store.id, name: o.store.name, slug: o.store.slug, whatsapp: o.store.whatsapp },
        expiresAt: o.expiresAt?.toISOString() ?? null,
        paySessionStartedAt: o.paySessionStartedAt?.toISOString() ?? null,
        verifiedAt: o.verifiedAt?.toISOString() ?? null,
        completedAt: o.completedAt?.toISOString() ?? null,
        downloadUsedAt: o.downloadUsedAt?.toISOString() ?? null,
        selfBuyFlag: o.selfBuyFlag,
        events: o.events.map((e) => ({
          id: e.id,
          status: e.status,
          label: e.label,
          note: e.note,
          actor: e.actor,
          createdAt: e.createdAt.toISOString(),
        })),
        latestReceipt: o.receipts[0]
          ? {
              id: o.receipts[0].id,
              fileName: o.receipts[0].fileName,
              amount: o.receipts[0].amount,
              transferAt: o.receipts[0].transferAt?.toISOString() ?? null,
              senderName: o.receipts[0].senderName,
              matchStatus: o.receipts[0].matchStatus,
              manipulationSuspected: o.receipts[0].manipulationSuspected,
              createdAt: o.receipts[0].createdAt.toISOString(),
            }
          : null,
        qrUrl: signedFileUrl(undefined), // QR diisi di endpoint detail saat sesi bayar aktif
        createdAt: o.createdAt.toISOString(),
      };
    });
    return json({ orders: dtos });
  });
}
