// GET /api/admin/csv?table=transactions|commissions|sellers - Export CSV per tabel
// dengan semua filter aktif diterapkan (SPEC-01-04)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handle, fail } from "@/lib/server/helpers";
import { requireSuperAdmin } from "@/lib/server/auth";
import { commissionOwed } from "@/lib/server/commission";

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const sp = req.nextUrl.searchParams;
    const table = sp.get("table") || "transactions";
    let csv = "";
    let filename = "export.csv";

    if (table === "transactions") {
      const where: Record<string, unknown> = {};
      const status = sp.get("status");
      if (status) where.status = status;
      const storeSlug = sp.get("store");
      if (storeSlug) where.store = { slug: storeSlug };
      const orders = await db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { product: { select: { title: true } }, store: { select: { name: true, slug: true } }, buyer: { select: { email: true } } },
      });
      csv = toCsv(
        ["Order ID", "Tanggal", "Produk", "Toko", "Buyer", "Tipe Jual", "Harga", "Komisi Snapshot", "Status", "Jalur Verifikasi"],
        orders.map((o) => [
          o.code,
          o.createdAt.toISOString(),
          o.product.title,
          o.store.name,
          o.store.slug === "sensitive" ? o.buyer.email : o.buyer.email, // GAP-06: Super-Admin akses penuh
          o.sellType,
          o.price,
          o.commissionSnapshot,
          o.status,
          o.verifyPath ?? "-",
        ])
      );
      filename = "transaksi-althentic.csv";
    } else if (table === "commissions") {
      const entries = await db.commissionLedger.findMany({
        orderBy: { createdAt: "desc" },
        include: { store: { select: { name: true, slug: true } }, order: { select: { code: true } } },
      });
      csv = toCsv(
        ["Ledger ID", "Toko", "Slug", "Order", "Nominal", "Status", "Invoice", "Tanggal Event"],
        entries.map((l) => [
          l.id,
          l.store.name,
          l.store.slug,
          l.order.code,
          l.amount,
          l.status,
          l.invoiceId ?? "-",
          l.createdAt.toISOString(),
        ])
      );
      filename = "komisi-althentic.csv";
    } else if (table === "sellers") {
      const stores = await db.store.findMany({
        orderBy: { createdAt: "asc" },
        include: { owner: { select: { email: true } } },
      });
      const rows: (string | number)[][] = [];
      for (const s of stores) {
        const [products, verifiedTx] = await Promise.all([
          db.product.count({ where: { storeId: s.id, status: "active" } }),
          db.order.count({ where: { storeId: s.id, status: { in: ["verified", "completed"] } } }),
        ]);
        rows.push([
          s.name,
          s.slug,
          s.owner.email,
          products,
          await commissionOwed(s.id),
          s.status,
          s.createdAt.toISOString(),
          verifiedTx,
          s.ratingAvg,
        ]);
      }
      csv = toCsv(
        ["Nama Toko", "Slug", "Email Owner", "Jumlah Produk", "Commission Owed", "Status", "Tanggal Join", "Transaksi Terverifikasi", "Rating"],
        rows
      );
      filename = "seller-althentic.csv";
    } else {
      return fail("Tabel tidak dikenal (transactions|commissions|sellers).", 400);
    }

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  });
}
