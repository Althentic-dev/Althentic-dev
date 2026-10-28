// GET /api/seller/commissions - Commission Owed berjalan + invoice + ledger (SPEC-09, GAP-09)
import { db } from "@/lib/db";
import { json, handle, fail } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { commissionOwed, uninvoicedOpen } from "@/lib/server/commission";
import type { InvoiceDTO } from "@/lib/types";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const store = await db.store.findUnique({ where: { ownerId: user.id } });
    if (!store) return fail("Buka toko dulu.", 404);

    const [owed, open, invoices, ledger, settledCount] = await Promise.all([
      commissionOwed(store.id),
      uninvoicedOpen(store.id),
      db.invoice.findMany({
        where: { storeId: store.id },
        orderBy: { issuedAt: "desc" },
        include: { entries: { select: { id: true } } },
      }),
      db.commissionLedger.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { order: { select: { code: true, product: { select: { title: true } } } } },
      }),
      db.commissionLedger.count({ where: { storeId: store.id, status: "settled" } }),
    ]);

    const now = new Date();
    const outstanding = invoices.find((i) => i.status === "outstanding");
    // Banner kuning saat tersisa 3 hari sebelum suspend (SPEC-09-03)
    const daysToSuspend = outstanding
      ? Math.ceil((outstanding.suspendAt.getTime() - now.getTime()) / (24 * 3600 * 1000))
      : null;
    const showYellowBanner = daysToSuspend !== null && daysToSuspend <= 3;

    const invoiceDtos: InvoiceDTO[] = invoices.map((i) => ({
      id: i.id,
      code: i.code,
      amount: i.amount,
      status: i.status,
      issuedAt: i.issuedAt.toISOString(),
      dueAt: i.dueAt.toISOString(),
      suspendAt: i.suspendAt.toISOString(),
      paidAt: i.paidAt?.toISOString() ?? null,
      paidAmount: i.paidAmount ?? null,
      paidMethod: i.paidMethod ?? null,
      paidReference: i.paidReference ?? null,
      entryCount: i.entries.length,
      store: { id: store.id, name: store.name, slug: store.slug },
    }));

    return json({
      owed,
      uninvoicedOpen: open,
      commissionCredit: store.commissionCredit,
      settledCount,
      invoices: invoiceDtos,
      ledger: ledger.map((l) => ({
        id: l.id,
        amount: l.amount,
        status: l.status,
        orderCode: l.order.code,
        productTitle: l.order.product.title,
        createdAt: l.createdAt.toISOString(),
      })),
      suspend: {
        reason: store.suspendReason,
        status: store.status,
        daysToSuspend,
        showYellowBanner,
      },
    });
  });
}
