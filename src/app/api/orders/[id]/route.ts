// GET  /api/orders/[id] — detail + timeline stepper (SPEC-04-05) + QR + WA
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { signedFileUrl, publicFileUrl } from "@/lib/server/notifications";
import { getSettings, renderWaTemplate } from "@/lib/server/settings";
import type { OrderDTO } from "@/lib/types";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, title: true, slug: true, previewPathsJson: true, version: true } },
        store: { select: { id: true, name: true, slug: true, whatsapp: true, qrPath: true, ownerId: true } },
        buyer: { select: { id: true, name: true, email: true } },
        events: { orderBy: { createdAt: "asc" } },
        receipts: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!order) return fail("Order tidak ditemukan.", 404);

    // Otorisasi per-ownership (SPEC-15-04, GAP-06):
    // buyer hanya order miliknya; seller hanya order tokonya (data buyer dibatasi);
    // Super-Admin akses penuh.
    const isBuyer = order.buyerId === user.id;
    const isSeller = order.store.ownerId === user.id;
    const isSuperAdmin = user.isSuperAdmin === true;
    if (!isBuyer && !isSeller && !isSuperAdmin) return fail("Tidak berhak mengakses order ini.", 403);

    const previews = JSON.parse(order.product.previewPathsJson || "[]") as string[];
    const settings = await getSettings();

    const dto: OrderDTO & { waLink?: string | null; buyerLimited?: { name: string } | null } = {
      id: order.id,
      code: order.code,
      status: order.status,
      verifyPath: order.verifyPath,
      price: order.price,
      sellType: order.sellType,
      product: {
        id: order.product.id,
        title: order.product.title,
        slug: order.product.slug,
        preview: publicFileUrl(previews[0]),
        version: order.product.version,
      },
      store: { id: order.store.id, name: order.store.name, slug: order.store.slug, whatsapp: order.store.whatsapp },
      // GAP-06: seller melihat data buyer terbatas (nama saja), bukan data pribadi lengkap
      buyer: isBuyer || isSuperAdmin ? { id: order.buyer.id, name: order.buyer.name, email: order.buyer.email } : undefined,
      buyerLimited: isSeller && !isBuyer ? { name: order.buyer.name.split(" ")[0] + " " + (order.buyer.name.split(" ")[1]?.[0] ?? "") + "." } : undefined,
      expiresAt: order.expiresAt?.toISOString() ?? null,
      paySessionStartedAt: order.paySessionStartedAt?.toISOString() ?? null,
      verifiedAt: order.verifiedAt?.toISOString() ?? null,
      completedAt: order.completedAt?.toISOString() ?? null,
      downloadUsedAt: order.downloadUsedAt?.toISOString() ?? null,
      selfBuyFlag: order.selfBuyFlag,
      events: order.events.map((e) => ({
        id: e.id,
        status: e.status,
        label: e.label,
        note: e.note,
        actor: e.actor,
        createdAt: e.createdAt.toISOString(),
      })),
      latestReceipt: order.receipts[0]
        ? {
            id: order.receipts[0].id,
            fileName: order.receipts[0].fileName,
            amount: order.receipts[0].amount,
            transferAt: order.receipts[0].transferAt?.toISOString() ?? null,
            senderName: order.receipts[0].senderName,
            matchStatus: order.receipts[0].matchStatus,
            manipulationSuspected: order.receipts[0].manipulationSuspected,
            createdAt: order.receipts[0].createdAt.toISOString(),
          }
        : null,
      qrUrl: order.paySessionStartedAt && order.store.qrPath ? signedFileUrl(order.store.qrPath) : null,
      commissionSnapshot: isSuperAdmin || isSeller ? order.commissionSnapshot : undefined,
      createdAt: order.createdAt.toISOString(),
    };

    // Tombol WhatsApp fallback (SPEC-04-03): template + ID order + nama produk
    if (order.store.whatsapp) {
      const message = renderWaTemplate(settings.waTemplate, {
        nama_buyer: order.buyer.name,
        nama_produk: order.product.title,
        jumlah: `Rp${order.price.toLocaleString("id-ID")}`,
        slug_toko: order.store.slug,
        id_order: order.code,
        nama_toko: order.store.name,
      });
      dto.waLink = `https://wa.me/${order.store.whatsapp}?text=${encodeURIComponent(message)}`;
    }
    return json({ order: dto });
  });
}
