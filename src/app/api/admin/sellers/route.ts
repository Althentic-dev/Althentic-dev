// GET /api/admin/sellers — tabel seller (Konteks Terkunci): nama toko, slug,
// jumlah produk, commission owed, status, tanggal join, total transaksi
// terverifikasi, rating. + aksi suspend/unsuspend manual.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, handle, fail } from "@/lib/server/helpers";
import { requireSuperAdmin } from "@/lib/server/auth";
import { commissionOwed, suspendStore, unsuspendStore } from "@/lib/server/commission";
import type { SellerRowDTO } from "@/lib/types";

export async function GET(req: Request) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const stores = await db.store.findMany({
      include: { owner: { select: { email: true } }, products: { select: { status: true } } },
      orderBy: { createdAt: "asc" },
    });
    const rows: SellerRowDTO[] = [];
    for (const s of stores) {
      const verifiedTx = await db.order.count({
        where: { storeId: s.id, status: { in: ["verified", "completed"] } },
      });
      rows.push({
        store: {
          id: s.id,
          name: s.name,
          slug: s.slug,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          accent: s.accentPreset,
        },
        ownerEmail: s.owner.email,
        productCount: s.products.filter((p) => p.status === "active").length,
        commissionOwed: await commissionOwed(s.id),
        verifiedTx,
        ratingAvg: s.ratingAvg,
      });
    }
    return json({ sellers: rows });
  });
}

// POST — suspend/unsuspend manual oleh Super-Admin (alasan terstruktur)
export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const body = (await req.json().catch(() => null)) as {
      storeId?: string;
      action?: "suspend" | "unsuspend";
      reason?: string;
    } | null;
    if (!body?.storeId || !body.action) return fail("Parameter tidak lengkap.", 422);
    if (body.action === "suspend") {
      if (!body.reason || body.reason.length < 5) {
        return fail("Alasan suspend wajib diisi (terstruktur).", 422);
      }
      await suspendStore(body.storeId, body.reason);
      return json({ ok: true });
    }
    await unsuspendStore(body.storeId);
    return json({ ok: true });
  });
}
