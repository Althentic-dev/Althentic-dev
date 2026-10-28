// GET /api/admin/overview - Overview lengkap (Konteks Terkunci):
// metrik ringkas + growth chart + kategori terlaris + konsentrasi top-1 seller
import { db } from "@/lib/db";
import { json, handle } from "@/lib/server/helpers";
import { requireSuperAdmin } from "@/lib/server/auth";
import type { AdminOverviewDTO } from "@/lib/types";

export async function GET(req: Request) {
  return handle(async () => {
    await requireSuperAdmin(req);

    const [verifiedOrders, sellers, totalProducts, totalBuyers, pendingVerif, openDisputes, invoices] =
      await Promise.all([
        db.order.findMany({
          where: { status: { in: ["verified", "completed"] } },
          select: { price: true, verifiedAt: true, storeId: true, productId: true, product: { select: { category: true } } },
        }),
        db.store.findMany({ select: { id: true, status: true, ownerId: true } }),
        db.product.count(),
        db.user.count({ where: { isSuperAdmin: false, softDeletedAt: null } }),
        db.product.count({ where: { status: "pending_verification" } }),
        db.dispute.count({ where: { status: { in: ["open", "investigating"] } } }),
        db.invoice.findMany({ where: {}, select: { amount: true, status: true } }),
      ]);

    const gmv = verifiedOrders.reduce((a, o) => a + o.price, 0);
    const commissionCollected = invoices
      .filter((i) => i.status === "paid")
      .reduce((a, i) => a + (i.amount ?? 0), 0);
    const commissionOutstanding = invoices
      .filter((i) => i.status === "outstanding")
      .reduce((a, i) => a + i.amount, 0);
    const activeSellers = sellers.filter((s) => s.status !== "suspended").length;
    const suspendedSellers = sellers.filter((s) => s.status === "suspended").length;

    // Growth chart harian + moving average 7 hari (SPEC-01-03)
    const days: { date: string; tx: number; ma7: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, tx: 0, ma7: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    for (const o of verifiedOrders) {
      const k = o.verifiedAt?.toISOString().slice(0, 10);
      const i = k ? idx.get(k) : undefined;
      if (i !== undefined) days[i].tx++;
    }
    for (let i = 0; i < days.length; i++) {
      const window = days.slice(Math.max(0, i - 6), i + 1);
      days[i].ma7 = Math.round((window.reduce((a, d) => a + d.tx, 0) / window.length) * 100) / 100;
    }

    // Kategori terlaris (verified)
    const catCount = new Map<string, number>();
    for (const o of verifiedOrders) {
      catCount.set(o.product.category, (catCount.get(o.product.category) ?? 0) + 1);
    }
    const topCategories = [...catCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));

    // Konsentrasi top-1 seller (SPEC-16-03)
    const storeTx = new Map<string, number>();
    for (const o of verifiedOrders) storeTx.set(o.storeId, (storeTx.get(o.storeId) ?? 0) + 1);
    const topSellerTx = Math.max(0, ...storeTx.values());
    const concentration = verifiedOrders.length ? Math.round((topSellerTx / verifiedOrders.length) * 100) : 0;

    const dto: AdminOverviewDTO = {
      gmv,
      verifiedTx: verifiedOrders.length,
      commissionCollected,
      commissionOutstanding,
      activeSellers,
      suspendedSellers,
      topSellerConcentration: concentration,
      totalProducts,
      totalBuyers,
      chart: days,
      topCategories,
      pendingVerifications: pendingVerif,
      openDisputes: openDisputes,
      outstandingInvoices: invoices.filter((i) => i.status === "outstanding").length,
    };
    return json(dto);
  });
}
