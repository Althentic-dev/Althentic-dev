// GET /api/admin/analytics - Analytics Platform (SPEC-01-01..03):
// periode default 7 hari + tab Hari ini/7/30/90/Custom; metrik 4 kartu; line chart + MA7.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, handle } from "@/lib/server/helpers";
import { requireSuperAdmin } from "@/lib/server/auth";

const RANGES: Record<string, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90 };

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const sp = req.nextUrl.searchParams;
    const range = sp.get("range") || "7d";
    let days = RANGES[range] ?? 7;
    if (range === "custom") {
      const from = sp.get("from");
      const to = sp.get("to");
      if (from && to) {
        days = Math.min(365, Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1));
      }
    }
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const [orders, invoices, sellers] = await Promise.all([
      db.order.findMany({
        where: { status: { in: ["verified", "completed"] }, verifiedAt: { gte: since } },
        select: { price: true, verifiedAt: true, storeId: true },
      }),
      db.invoice.findMany({ select: { amount: true, status: true } }),
      db.store.findMany({ select: { status: true } }),
    ]);

    const gmv = orders.reduce((a, o) => a + o.price, 0);
    const commissionCollected = invoices.filter((i) => i.status === "paid").reduce((a, i) => a + i.amount, 0);
    const commissionOutstanding = invoices.filter((i) => i.status === "outstanding").reduce((a, i) => a + i.amount, 0);

    const chart: { date: string; tx: number; ma7: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000);
      chart.push({ date: d.toISOString().slice(0, 10), tx: 0, ma7: 0 });
    }
    const idx = new Map(chart.map((d, i) => [d.date, i]));
    for (const o of orders) {
      const k = o.verifiedAt?.toISOString().slice(0, 10);
      const i = k ? idx.get(k) : undefined;
      if (i !== undefined) chart[i].tx++;
    }
    for (let i = 0; i < chart.length; i++) {
      const window = chart.slice(Math.max(0, i - 6), i + 1);
      chart[i].ma7 = Math.round((window.reduce((a, d) => a + d.tx, 0) / window.length) * 100) / 100;
    }

    const activeSellers = sellers.filter((s) => s.status !== "suspended").length;
    const suspendedSellers = sellers.filter((s) => s.status === "suspended").length;

    return json({
      range,
      days,
      gmv,
      verifiedTx: orders.length,
      commissionCollected,
      commissionOutstanding,
      activeSellers,
      suspendedSellers,
      sellerRatio: sellers.length ? Math.round((activeSellers / sellers.length) * 100) : 100,
      chart,
    });
  });
}
