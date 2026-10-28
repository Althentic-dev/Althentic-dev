// GET /api/stats — statistik publik untuk social proof landing (section 5) &
// kategori populer untuk state kosong katalog (SPEC-03-04).
import { db } from "@/lib/db";
import { json, handle } from "@/lib/server/helpers";

export async function GET() {
  return handle(async () => {
    const [verifiedTx, totalProducts, stores, reviews] = await Promise.all([
      db.order.count({ where: { status: { in: ["verified", "completed"] } } }),
      db.product.count({ where: { status: "active" } }),
      db.store.count({ where: { status: "live" } }),
      db.review.findMany({
        where: { deletedAt: null, rating: { gte: 4 } },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          user: { select: { name: true } },
          product: { select: { title: true, slug: true } },
        },
      }),
    ]);

    const rated = await db.product.findMany({
      where: { ratingCount: { gt: 0 } },
      select: { ratingAvg: true, ratingCount: true },
    });
    const ratingCount = rated.reduce((a, p) => a + p.ratingCount, 0);
    const ratingAvg = ratingCount
      ? Math.round((rated.reduce((a, p) => a + p.ratingAvg * p.ratingCount, 0) / ratingCount) * 10) / 10
      : 0;

    return json({
      verifiedTx,
      totalProducts,
      liveStores: stores,
      ratingAvg,
      ratingCount,
      testimonials: reviews.map((r) => ({
        id: r.id,
        name: r.user.name,
        rating: r.rating,
        text: r.text,
        productTitle: r.product.title,
        productSlug: r.product.slug,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  });
}
