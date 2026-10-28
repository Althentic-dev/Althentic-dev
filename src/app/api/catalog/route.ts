// GET /api/catalog — katalog dengan filter URL, pencarian, sort, pagination
// (SPEC-03-01..05, GAP-14). Grid 3/2/1 kolom ditangani frontend.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, handle } from "@/lib/server/helpers";
import { publicFileUrl } from "@/lib/server/notifications";
import { PAGE_SIZE, PRICE_CHIPS, CATEGORIES } from "@/lib/constants";
import type { ProductCardDTO } from "@/lib/types";

export async function GET(req: NextRequest) {
  return handle(async () => {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("cat") || "";
    const type = sp.get("type") || "";
    const priceChip = sp.get("price") || "";
    const rating = sp.get("rating") || "all";
    const q = (sp.get("q") || "").trim();
    const sort = sp.get("sort") || "weekly";
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);

    const where: Record<string, unknown> = {
      status: "active",
      store: { status: { in: ["live", "ready"] } },
    };
    if (category && CATEGORIES.some((c) => c.id === category)) where.category = category;
    if (type) where.sellTypesCsv = { contains: type };
    const chip = PRICE_CHIPS.find((c) => c.id === priceChip);
    if (chip) {
      where.minPrice = { gte: chip.min, lte: chip.max };
    }
    const ratingMin = rating === "min4" ? 4 : rating === "min3" ? 3 : 0;
    if (ratingMin > 0) where.ratingAvg = { gte: ratingMin };

    // Pencarian: judul, deskripsi, nama toko (SPEC-03-04)
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { store: { name: { contains: q } } },
      ];
    }

    // Sorting (SPEC-03-03)
    let orderBy: Record<string, string>[] | Record<string, string> = { createdAt: "desc" };
    if (sort === "newest") orderBy = { createdAt: "desc" };
    else if (sort === "cheapest") orderBy = { minPrice: "asc" };
    else if (sort === "priciest") orderBy = { minPrice: "desc" };
    else if (sort === "rating") orderBy = [{ ratingAvg: "desc" }, { ratingCount: "desc" }];

    const [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        orderBy: sort === "weekly" ? { salesCount: "desc" } : orderBy,
        include: { store: { select: { name: true, slug: true, status: true } } },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
    ]);

    // Terlaris minggu ini: transaksi verified 7 hari terakhir, descending (GAP-14)
    let items = products;
    if (sort === "weekly") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      const grouped = await db.order.groupBy({
        by: ["productId"],
        where: {
          status: { in: ["verified", "completed"] },
          verifiedAt: { gte: weekAgo },
          selfBuyFlag: false, // self-buy tidak dihitung (SPEC-16-12)
        },
        _count: { _all: true },
      });
      const salesMap = new Map(grouped.map((g) => [g.productId, g._count._all]));
      items = [...products].sort((a, b) => {
        const sa = salesMap.get(a.id) ?? 0;
        const sb = salesMap.get(b.id) ?? 0;
        if (sb !== sa) return sb - sa;
        return b.salesCount - a.salesCount;
      });
    }

    const cards: ProductCardDTO[] = items.map((p) => {
      const previews = JSON.parse(p.previewPathsJson || "[]") as string[];
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        category: p.category,
        minPrice: p.minPrice,
        sellTypes: p.sellTypesCsv ? p.sellTypesCsv.split(",") : [],
        preview: publicFileUrl(previews[0]),
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        salesCount: p.salesCount,
        storeName: p.store.name,
        storeSlug: p.store.slug,
        createdAt: p.createdAt.toISOString(),
      };
    });

    // Kategori populer: transaksi verified per kategori rolling 30 hari (GAP-14)
    const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const popular = await db.order.groupBy({
      by: ["productId"],
      where: { status: { in: ["verified", "completed"] }, verifiedAt: { gte: monthAgo } },
      _count: { _all: true },
    });
    const productIds = popular.map((g) => g.productId);
    const cats = productIds.length
      ? await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, category: true } })
      : [];
    const catById = new Map(cats.map((c) => [c.id, c.category]));
    const catCount = new Map<string, number>();
    popular.forEach((g) => {
      const cat = catById.get(g.productId);
      if (cat) catCount.set(cat, (catCount.get(cat) ?? 0) + g._count._all);
    });
    const popularCategories = [...catCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => CATEGORIES.find((c) => c.id === id)?.label ?? id);

    return json({
      products: cards,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      popularCategories,
    });
  });
}
