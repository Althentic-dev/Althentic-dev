// GET /api/products/[slug] — detail produk (SPEC-03-06, GAP-14 produk serupa)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { getSessionUser } from "@/lib/server/auth";
import { publicFileUrl } from "@/lib/server/notifications";
import { formatBytes } from "@/lib/format";
import type { ProductDetailDTO, ReviewDTO, ProductCardDTO } from "@/lib/types";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const { slug } = await ctx.params;
    const user = await getSessionUser(req);

    const product = await db.product.findUnique({
      where: { slug },
      include: {
        store: { select: { id: true, name: true, slug: true, accentPreset: true, status: true, ownerId: true } },
        reviews: {
          where: { deletedAt: null },
          include: { user: { select: { name: true } }, order: { select: { buyerId: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!product) return fail("Produk tidak ditemukan.", 404);

    const isOwner = user?.id === product.store.ownerId;
    const isSuperAdmin = user?.isSuperAdmin === true;
    // Publik hanya melihat produk aktif; pemilik & Super-Admin bisa melihat semua status
    if (product.status !== "active" && !isOwner && !isSuperAdmin) {
      return fail("Produk tidak tersedia.", 404);
    }

    // Status pembelian buyer
    let owned = false;
    let pendingOrderId: string | null = null;
    let canReview = false;
    if (user) {
      const orders = await db.order.findMany({
        where: { productId: product.id, buyerId: user.id },
        select: { id: true, status: true },
      });
      owned = orders.some((o) => o.status === "verified" || o.status === "completed");
      pendingOrderId = orders.find((o) => ["pending_payment", "payment_submitted", "rejected"].includes(o.status))?.id ?? null;
      const hasReview = await db.review.findFirst({
        where: { productId: product.id, userId: user.id },
        select: { id: true },
      });
      canReview = owned && !hasReview;
    }

    const reviews: ReviewDTO[] = product.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      userName: r.user.name,
      createdAt: r.createdAt.toISOString(),
      editedAt: r.editedAt?.toISOString() ?? null,
      replyText: r.replyText,
      repliedAt: r.repliedAt?.toISOString() ?? null,
      flagged: r.flagged,
      canEdit: user?.id === r.order.buyerId && Date.now() - r.createdAt.getTime() < 7 * 24 * 3600 * 1000,
      canReply: isOwner && !r.replyText,
    }));

    // Produk serupa: kategori sama + rentang harga ±30% (GAP-14)
    const base = product.minPrice || 10000;
    const similarWhere = {
      status: "active",
      category: product.category,
      id: { not: product.id },
      store: { status: { in: ["live", "ready"] } },
      minPrice: { gte: Math.floor(base * 0.7), lte: Math.ceil(base * 1.3) },
    };
    const similarProducts = await db.product.findMany({
      where: similarWhere,
      take: 3,
      orderBy: { salesCount: "desc" },
      include: { store: { select: { name: true, slug: true } } },
    });
    const similar: ProductCardDTO[] = similarProducts.map((p) => {
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

    const previews = JSON.parse(product.previewPathsJson || "[]") as string[];
    const sellTypes = JSON.parse(product.sellTypesJson) as {
      type: "template" | "prompt" | "bundle";
      price: number;
      driveFileId?: string;
      fileName?: string;
    }[];

    const dto: ProductDetailDTO = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      category: product.category,
      sellTypes,
      previews: previews.map((p) => publicFileUrl(p)).filter(Boolean) as string[],
      liveDemoUrl: product.liveDemoUrl,
      zipSize: product.zipSize,
      fileHash: product.fileHash,
      status: product.status,
      version: product.version,
      versionNote: product.versionNote,
      ratingAvg: product.ratingAvg,
      ratingCount: product.ratingCount,
      salesCount: product.salesCount,
      store: {
        id: product.store.id,
        name: product.store.name,
        slug: product.store.slug,
        accent: product.store.accentPreset,
      },
      reviews,
      similar,
      owned,
      canReview,
      pendingOrderId,
    };
    void formatBytes;
    return json({ product: dto });
  });
}
