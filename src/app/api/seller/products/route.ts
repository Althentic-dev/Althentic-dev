// GET/POST /api/seller/products: daftar & buat produk (draft)
// PUT/DELETE via /api/seller/products/[id]
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { publicFileUrl } from "@/lib/server/notifications";
import { CATEGORIES } from "@/lib/constants";

async function myStore(userId: string) {
  const store = await db.store.findUnique({ where: { ownerId: userId } });
  if (!store) throw Object.assign(new Error("Buka toko dulu lewat onboarding."), { status: 404 });
  return store;
}

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const store = await myStore(user.id);
    const products = await db.product.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      include: { inspections: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    return json({
      products: products.map((p) => {
        const previews = JSON.parse(p.previewPathsJson || "[]") as string[];
        const sellTypes = JSON.parse(p.sellTypesJson) as { type: string; price: number; driveFileId?: string }[];
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          category: p.category,
          status: p.status,
          minPrice: p.minPrice,
          sellTypes,
          sellTypesCsv: p.sellTypesCsv,
          preview: publicFileUrl(previews[0]),
          previewCount: previews.length,
          liveDemoUrl: p.liveDemoUrl,
          zipSize: p.zipSize,
          fileHash: p.fileHash,
          ratingAvg: p.ratingAvg,
          ratingCount: p.ratingCount,
          salesCount: p.salesCount,
          version: p.version,
          versionNote: p.versionNote,
          rejectedReason: p.rejectedReason,
          rejectedAt: p.rejectedAt?.toISOString() ?? null,
          latestInspection: p.inspections[0]?.markdown ?? null,
          createdAt: p.createdAt.toISOString(),
        };
      }),
    });
  });
}

const productSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter.").max(120),
  description: z.string().min(20, "Deskripsi minimal 20 karakter.").max(5000),
  category: z.enum(["website", "research", "education", "content", "design", "other"]),
  // GAP-14: tipe jual hanya kategori Website; lainnya prompt saja satu harga
  sellTypes: z
    .array(
      z.object({
        type: z.enum(["template", "prompt", "bundle"]),
        price: z.number().int().min(0).max(100000000),
        driveFileId: z.string().min(3, "ID file Google Drive wajib diisi."),
      })
    )
    .min(1, "Minimal satu tipe jual.")
    .max(3),
  previewBase64: z.array(z.string()).min(1, "Minimal 1 gambar preview.").max(5, "Maksimal 5 gambar preview."),
  liveDemoUrl: z.string().url().optional().nullable(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req);
    const store = await myStore(user.id);
    if (store.status === "suspended") return fail("Toko suspended: tidak bisa menambah produk.", 403);

    const parsed = productSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak valid.", 422);
    const { title, description, category, sellTypes, previewBase64, liveDemoUrl } = parsed.data;

    // Validasi tipe jual per kategori (GAP-14)
    if (category !== "website" && (sellTypes.length > 1 || sellTypes[0].type !== "prompt")) {
      return fail("Kategori selain Website hanya menjual tipe 'Prompt' dengan satu harga.", 422);
    }
    const requiresDemo = sellTypes.some((s) => s.type === "template" || s.type === "bundle");
    if (requiresDemo && !liveDemoUrl) {
      return fail("Live demo wajib untuk tipe jual yang menyertakan template jadi.", 422, "DEMO_REQUIRED");
    }

    // Preview → webp public bucket (maks 5, GAP-14)
    const { putObject, convertToWebp } = await import("@/lib/server/storage");
    const previewPaths: string[] = [];
    for (const b64 of previewBase64) {
      const buf = Buffer.from(b64, "base64");
      if (buf.length > 5 * 1024 * 1024) return fail("Preview maksimal 5 MB per gambar.", 422);
      let webp: Buffer;
      try {
        webp = await convertToWebp(buf, 1200);
      } catch {
        return fail("Ada file preview yang bukan gambar valid.", 422);
      }
      previewPaths.push(await putObject("public", `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}/preview-${previewPaths.length + 1}.webp`, webp, "image/webp"));
    }

    // Slug unik
    let slug = slugify(title) || "produk";
    const exists = await db.product.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const product = await db.product.create({
      data: {
        storeId: store.id,
        title,
        slug,
        description,
        category,
        sellTypesJson: JSON.stringify(sellTypes),
        sellTypesCsv: sellTypes.map((s) => s.type).join(","),
        minPrice: Math.min(...sellTypes.map((s) => s.price)),
        previewPathsJson: JSON.stringify(previewPaths),
        liveDemoUrl: liveDemoUrl ?? null,
        status: "draft",
      },
    });
    return json({ ok: true, productId: product.id, slug: product.slug }, 201);
  });
}
