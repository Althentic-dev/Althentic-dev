// GET /api/seller/analytics - 4 kartu + grafik 30 hari + 5 produk teratas (SPEC-02-08)
import { db } from "@/lib/db";
import { json, handle, fail } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { commissionOwed } from "@/lib/server/commission";
import type { SellerStatsDTO } from "@/lib/types";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const store = await db.store.findUnique({ where: { ownerId: user.id } });
    if (!store) return fail("Buka toko dulu.", 404);

    const verified = await db.order.findMany({
      where: { storeId: store.id, status: { in: ["verified", "completed"] } },
      select: { price: true, verifiedAt: true, productId: true, product: { select: { title: true, slug: true } } },
    });

    const grossRevenue = verified.reduce((a, o) => a + o.price, 0);
    const owed = await commissionOwed(store.id);

    // Grafik 30 hari
    const days: { date: string; tx: number; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000);
      const key = d.toISOString().slice(0, 10);
      const dayOrders = verified.filter(
        (o) => o.verifiedAt && o.verifiedAt.toISOString().slice(0, 10) === key
      );
      days.push({
        date: key,
        tx: dayOrders.length,
        revenue: dayOrders.reduce((a, o) => a + o.price, 0),
      });
    }

    // 5 produk teratas
    const byProduct = new Map<string, { title: string; slug: string; sales: number; revenue: number }>();
    for (const o of verified) {
      const cur = byProduct.get(o.productId) ?? { title: o.product.title, slug: o.product.slug, sales: 0, revenue: 0 };
      cur.sales++;
      cur.revenue += o.price;
      byProduct.set(o.productId, cur);
    }
    const topProducts = [...byProduct.values()].sort((a, b) => b.sales - a.sales).slice(0, 5);
    const top = topProducts[0] ?? null;

    const dto: SellerStatsDTO = {
      verifiedTx: verified.length,
      grossRevenue,
      commissionOwed: owed,
      topProduct: top ? { title: top.title, slug: top.slug, sales: top.sales } : null,
      chart: days,
      topProducts,
    };
    return json(dto);
  });
}
