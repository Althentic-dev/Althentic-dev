// GET /api/stores/[slug] — profil publik toko (SPEC-13-01)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { getSessionUser } from "@/lib/server/auth";
import { publicFileUrl } from "@/lib/server/notifications";
import type { ProductCardDTO, StorePublicDTO } from "@/lib/types";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const { slug } = await ctx.params;
    const user = await getSessionUser(req);
    const store = await db.store.findUnique({
      where: { slug },
      include: { owner: { select: { id: true } } },
    });
    if (!store) return fail("Toko tidak ditemukan.", 404);

    const isOwner = user?.id === store.owner.id;
    const isSuperAdmin = user?.isSuperAdmin === true;
    // Toko "Disiapkan" hanya terlihat pemiliknya (SPEC-06-04)
    if ((store.status === "preparing" || store.status === "suspended") && !isOwner && !isSuperAdmin) {
      return fail("Toko tidak tersedia untuk publik.", 404);
    }

    const products = await db.product.findMany({
      where: {
        storeId: store.id,
        ...(isOwner || isSuperAdmin ? {} : { status: "active" }),
      },
      include: { store: { select: { name: true, slug: true } } },
      orderBy: { salesCount: "desc" },
    });

    const cards: ProductCardDTO[] = products.map((p) => {
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
        storeName: store.name,
        storeSlug: store.slug,
        createdAt: p.createdAt.toISOString(),
      };
    });

    const dto: StorePublicDTO = {
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      accent: store.accentPreset,
      bannerUrl: publicFileUrl(store.bannerPath),
      socials: { ig: store.socialIg ?? undefined, x: store.socialX ?? undefined, tiktok: store.socialTiktok ?? undefined },
      status: store.status,
      stats: {
        productCount: products.filter((p) => p.status === "active").length,
        ratingAvg: store.ratingAvg,
        ratingCount: store.ratingCount,
        joinedYear: store.createdAt.getFullYear(),
      },
      products: cards,
    };
    return json({ store: dto });
  });
}
