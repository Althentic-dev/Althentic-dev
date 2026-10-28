// PUT /api/seller/products/[id] - edit produk (harga baru hanya order berikutnya - SPEC-02-10;
// update ZIP inti → versi naik + notifikasi buyer lama GAP-05)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { notifyUser } from "@/lib/server/notifications";

const editSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(20).max(5000).optional(),
  sellTypes: z
    .array(
      z.object({
        type: z.enum(["template", "prompt", "bundle"]),
        price: z.number().int().min(0),
        driveFileId: z.string().min(3),
      })
    )
    .min(1)
    .max(3)
    .optional(),
  liveDemoUrl: z.string().url().nullable().optional(),
  versionNote: z.string().max(300).optional(),
});

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const product = await db.product.findUnique({ where: { id }, include: { store: true } });
    if (!product) return fail("Produk tidak ditemukan.", 404);
    if (product.store.ownerId !== user.id) return fail("Bukan produk tokomu.", 403);
    if (["archived"].includes(product.status)) return fail("Produk diarsipkan - unarchive dulu.", 400);

    const parsed = editSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak valid.", 422);
    const data: Record<string, unknown> = {};

    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.liveDemoUrl !== undefined) data.liveDemoUrl = parsed.data.liveDemoUrl;

    let coreChanged = false;
    if (parsed.data.sellTypes) {
      const old = JSON.parse(product.sellTypesJson) as { type: string; driveFileId?: string; price: number }[];
      const next = parsed.data.sellTypes;
      // GAP-05: notifikasi ke buyer lama HANYA bila file ZIP inti berubah
      coreChanged = old.some(
        (o) => next.find((n) => n.type === o.type)?.driveFileId !== o.driveFileId
      );
      data.sellTypesJson = JSON.stringify(next);
      data.sellTypesCsv = next.map((s) => s.type).join(",");
      data.minPrice = Math.min(...next.map((s) => s.price));
    }

    const updated = await db.product.update({
      where: { id },
      data: {
        ...data,
        version: coreChanged ? { increment: 1 } : product.version,
        versionNote: coreChanged ? (parsed.data.versionNote ?? "Update file ZIP inti") : product.versionNote,
      },
    });

    // Notifikasi informatif ke buyer lama saat ZIP inti berubah (GAP-05) - tanpa re-grant
    if (coreChanged) {
      const buyers = await db.order.findMany({
        where: { productId: product.id, status: { in: ["verified", "completed"] } },
        select: { buyerId: true },
        distinct: ["buyerId"],
      });
      for (const b of buyers) {
        await notifyUser({
          userId: b.buyerId,
          type: "product_update",
          title: `Produk yang kamu beli diperbarui: ${updated.title}`,
          body: `File ZIP inti diperbarui ke v${updated.version}. Notifikasi ini informatif - akses unduh tidak di-grant ulang otomatis.`,
          linkQuery: `v=collection`,
        });
      }
    }

    return json({
      ok: true,
      version: updated.version,
      message: coreChanged
        ? "Produk diperbarui - file ZIP inti berubah, versi naik & buyer lama diberi tahu."
        : "Produk diperbarui.",
    });
  });
}

// DELETE = arsip (SPEC-02-09): hilang dari katalog, histori tetap, bisa unarchive ke draft
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const product = await db.product.findUnique({ where: { id }, include: { store: true } });
    if (!product) return fail("Produk tidak ditemukan.", 404);
    if (product.store.ownerId !== user.id) return fail("Bukan produk tokomu.", 403);
    const unarchive = new URL(req.url).searchParams.get("unarchive") === "1";
    if (unarchive) {
      await db.product.update({ where: { id }, data: { status: "draft" } }); // kembali ke draft (SPEC-02-09)
      return json({ ok: true, status: "draft" });
    }
    await db.product.update({ where: { id }, data: { status: "archived" } });
    return json({ ok: true, status: "archived" });
  });
}
