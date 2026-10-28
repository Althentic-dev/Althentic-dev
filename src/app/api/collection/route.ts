// GET /api/collection — Koleksi Saya (SPEC-11-06): order Lunas + tombol unduh,
// info versi, tanggal beli. Tombol berubah "Sudah diunduh" (disabled) setelah habis.
import { db } from "@/lib/db";
import { json, handle } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { publicFileUrl } from "@/lib/server/notifications";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const orders = await db.order.findMany({
      where: { buyerId: user.id, status: { in: ["verified", "completed"] } },
      orderBy: { verifiedAt: "desc" },
      include: {
        product: { select: { id: true, title: true, slug: true, previewPathsJson: true, version: true } },
        store: { select: { name: true, slug: true } },
      },
    });
    const items = orders.map((o) => {
      const previews = JSON.parse(o.product.previewPathsJson || "[]") as string[];
      return {
        orderId: o.id,
        code: o.code,
        title: o.product.title,
        slug: o.product.slug,
        preview: publicFileUrl(previews[0]),
        version: o.product.version,
        storeName: o.store.name,
        storeSlug: o.store.slug,
        price: o.price,
        verifiedAt: o.verifiedAt?.toISOString(),
        downloadUsedAt: o.downloadUsedAt?.toISOString() ?? null, // GAP-13: tombol "Sudah diunduh"
      };
    });
    return json({ items });
  });
}
