// POST /api/orders/[id]/receipt — upload bukti transfer (SPEC-04-04, SPEC-07-*)
// Satu gambar per percobaan (JPG/PNG/HEIC ≤5MB), preview client-side sebelum submit.
// Flow: hash duplikat → WebP private bucket → AI Receipt Scanner (BYOK chain
// timeout 15s retry 1x) → aturan nominal/waktu/manipulasi → verify / reject /
// manual (Booked) / WA fallback.
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle, getClientIp } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { rateLimit, rateLimitKey } from "@/lib/server/rate-limit";
import { putObject, convertToWebp } from "@/lib/server/storage";
import { runScanner, fileHash } from "@/lib/server/scanner";
import { verifyOrder, rejectOrder, addEvent } from "@/lib/server/orders";
import { notifyUser } from "@/lib/server/notifications";
import { tplReceiptReceived, tplKeyRotationReminder } from "@/lib/server/email";
import { decryptSecret } from "@/lib/server/crypto";

const schema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.string(),
  dataBase64: z.string().min(32),
});

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB (SPEC-04-04)

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const ip = getClientIp(req);
    const rl = rateLimit(rateLimitKey(ip, user.id, "receipt"));
    if (!rl.ok) return fail("Terlalu banyak unggahan. Tunggu sebentar.", 429);

    const order = await db.order.findUnique({
      where: { id },
      include: {
        product: { select: { title: true, slug: true } },
        store: { include: { owner: true } },
        buyer: true,
      },
    });
    if (!order) return fail("Order tidak ditemukan.", 404);
    if (order.buyerId !== user.id) return fail("Bukan order milikmu.", 403);
    if (!["pending_payment", "rejected"].includes(order.status)) {
      return fail("Order ini tidak menerima bukti baru.", 400);
    }
    if (order.expiresAt && order.expiresAt < new Date()) {
      return fail("Order sudah kedaluwarsa (24 jam). Silakan order ulang.", 410);
    }
    if (!order.paySessionStartedAt) {
      return fail("Tekan \"Bayar Sekarang\" dulu untuk memulai sesi pembayaran.", 400, "PAY_SESSION_NOT_STARTED");
    }

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Format unggahan tidak valid.", 422);
    if (!ALLOWED.includes(parsed.data.contentType.toLowerCase())) {
      return fail("Bukti harus gambar JPG, PNG, atau HEIC.", 422);
    }
    const buf = Buffer.from(parsed.data.dataBase64, "base64");
    if (buf.length > MAX_BYTES) return fail("Ukuran maksimal bukti 5 MB.", 422);
    if (buf.length < 1024) return fail("File tidak terbaca sebagai gambar valid.", 422);

    // Deteksi duplikat via file hash (SPEC-07-04)
    const hash = fileHash(buf);
    const dup = await db.receipt.findFirst({ where: { fileHash: hash } });
    if (dup) {
      await db.receipt.create({
        data: {
          orderId: order.id,
          fileName: parsed.data.fileName,
          fileHash: hash,
          matchStatus: "duplicate",
        },
      });
      return fail("Bukti duplikat — gambar ini sudah pernah dipakai untuk order lain.", 422, "DUPLICATE");
    }

    // Konversi WebP → bucket private receipts/{orderId}/{timestamp}.webp (SPEC-07-06)
    let webp: Buffer;
    try {
      webp = await convertToWebp(buf, 1600);
    } catch {
      return fail("Gambar tidak bisa diproses. Pastikan file bukti valid.", 422);
    }
    const ts = Date.now();
    const objectPath = `receipts/${order.id}/${ts}.webp`;
    await putObject("private", objectPath, webp, "image/webp");

    // Jalur verifikasi (Konteks Terkunci): seller punya key → AI; skip → manual
    const store = order.store;
    const hasKeys =
      store.aiProvider === "zai" ||
      (!!store.aiKeyPrimaryEnc || !!store.aiKeyFallbackEnc);
    const verifyPath = hasKeys ? "ai" : "manual";

    // Simpan receipt metadata (tanpa raw AI response — GAP-12)
    const receipt = await db.receipt.create({
      data: {
        orderId: order.id,
        filePath: `private/${objectPath}`,
        fileName: parsed.data.fileName,
        fileHash: hash,
        scannerProvider: verifyPath === "ai" ? store.aiProvider : null,
      },
    });

    // Update status order → payment_submitted
    await db.order.update({
      where: { id: order.id },
      data: { status: "payment_submitted", verifyPath },
    });
    await addEvent(order.id, "payment_submitted", "Bukti transfer diterima", "buyer", parsed.data.fileName);

    // Email buyer: bukti diterima & sedang diverifikasi (SPEC-04-06 #2)
    await notifyUser({
      userId: order.buyerId,
      type: "order_update",
      title: `Bukti diterima — ${order.code}`,
      body: "Bukti transfer kamu sedang diverifikasi.",
      linkQuery: `v=checkout&id=${order.id}`,
      email: {
        to: order.buyer.email,
        subject: `Bukti diterima — ${order.code}`,
        body: tplReceiptReceived({ buyerName: order.buyer.name, orderCode: order.code }),
        kind: "order_receipt",
      },
    });

    // ---------- Jalur manual (seller skip API key — SPEC-06-03) ----------
    if (verifyPath === "manual") {
      await notifyUser({
        userId: store.ownerId,
        type: "order_update",
        title: `Perlu tindakan: verifikasi manual ${order.code}`,
        body: "Bukti transfer masuk — verifikasi manual dengan 3 checklist wajib.",
        linkQuery: `v=dashboard&tab=orders`,
      });
      return json({
        ok: true,
        status: "payment_submitted",
        verifyPath: "manual",
        message: "Bukti diterima. Order berstatus Booked menunggu persetujuan manual seller (maks. 24 jam).",
      });
    }

    // ---------- Jalur AI Receipt Scanner ----------
    const keys = {
      provider: store.aiProvider,
      primary: store.aiKeyPrimaryEnc ? decryptSecret(store.aiKeyPrimaryEnc) : null,
      fallback: store.aiKeyFallbackEnc ? decryptSecret(store.aiKeyFallbackEnc) : null,
    };
    const { result, usedKey, failed } = await runScanner(
      { imageBase64: buf.toString("base64"), mimeType: parsed.data.contentType },
      keys
    );

    // Data terstruktur tersimpan (GAP-12) — tanpa raw response
    await db.receipt.update({
      where: { id: receipt.id },
      data: {
        amount: result.amount,
        transferAt: result.transferAt,
        senderName: result.senderName,
        manipulationSuspected: result.manipulationSuspected,
        matchStatus: failed ? "ai_failed" : "matched",
      },
    });

    if (failed) {
      // Kedua key gagal → Booked + Perlu Tindakan + WA + email (SPEC-07-10)
      await db.order.update({ where: { id: order.id }, data: { verifyPath: "wa" } });
      await addEvent(order.id, "payment_submitted", "Verifikasi AI gagal — menunggu tindakan seller", "system");
      // Hitung kegagalan key → 3x berturut → pengingat rotasi (SPEC-07-09)
      const failCount = store.aiKeyFailCount + 1;
      await db.store.update({ where: { id: store.id }, data: { aiKeyFailCount: failCount } });
      if (failCount >= 3) {
        await notifyUser({
          userId: store.ownerId,
          type: "system",
          title: "API key gagal 3x — rotasi diperlukan",
          body: "Ganti key AI dari Settings Toko agar verifikasi kembali otomatis.",
          linkQuery: `v=dashboard&tab=store`,
          email: {
            to: store.owner.email,
            subject: "Pengingat rotasi API key",
            body: tplKeyRotationReminder({ sellerName: store.name }),
            kind: "key_rotation_reminder",
          },
        });
        await db.store.update({ where: { id: store.id }, data: { aiKeyFailCount: 0 } });
      }
      await notifyUser({
        userId: store.ownerId,
        type: "order_update",
        title: `Perlu tindakan: ${order.code}`,
        body: "Kedua key AI gagal — hubungi buyer via WhatsApp untuk penyelesaian manual.",
        linkQuery: `v=dashboard&tab=orders`,
      });
      return json({
        ok: true,
        status: "payment_submitted",
        verifyPath: "wa",
        message: "Verifikasi AI gagal total. Order berstatus Booked — hubungi seller via WhatsApp (tombol tersedia di halaman order).",
      });
    }

    // Bukti bukan struktuk transfer / tidak terbaca
    if (!result.ok || result.amount === null) {
      await rejectOrder({
        orderId: order.id,
        reason: "Bukti tidak terbaca sebagai bukti transfer yang valid. Pastikan tangkapan layar menampilkan nominal, tanggal, dan nama pengirim.",
        actor: "ai",
      });
      return json({ ok: true, status: "rejected", message: "Bukti tidak terbaca — silakan upload ulang." });
    }

    // Aturan waktu: dalam jendela sesi (SPEC-07-02)
    if (result.transferAt && result.transferAt < order.paySessionStartedAt) {
      await rejectOrder({
        orderId: order.id,
        reason: "Timestamp transfer lebih lama dari sesi order (sebelum kamu menekan Bayar Sekarang).",
        actor: "ai",
      });
      return json({ ok: true, status: "rejected", message: "Bukti kedaluwarsa — timestamp di luar jendela sesi." });
    }

    // Manipulasi → review manual dengan area dicurigai (SPEC-07-05)
    if (result.manipulationSuspected) {
      await db.receipt.update({ where: { id: receipt.id }, data: { matchStatus: "suspicious" } });
      await addEvent(order.id, "payment_submitted", "Dugaan manipulasi bukti — masuk review manual", "ai", result.notes);
      await notifyUser({
        userId: store.ownerId,
        type: "order_update",
        title: `Review manual: ${order.code} (indikasi manipulasi)`,
        body: `AI menandai indikasi manipulasi: ${result.notes ?? "-"}`,
        linkQuery: `v=dashboard&tab=orders`,
      });
      return json({
        ok: true,
        status: "payment_submitted",
        verifyPath: "manual",
        message: "Bukti ditandai untuk review manual (indikasi manipulasi terdeteksi).",
      });
    }

    // Nominal: persis / kurang / lebih (SPEC-07-01)
    if (result.amount < order.price) {
      await db.receipt.update({ where: { id: receipt.id }, data: { matchStatus: "underpaid" } });
      await rejectOrder({
        orderId: order.id,
        reason: `Nominal terbaca Rp${result.amount.toLocaleString("id-ID")} — kurang dari harga Rp${order.price.toLocaleString("id-ID")}. Upload bukti susulan dengan nominal yang tepat.`,
        actor: "ai",
      });
      return json({ ok: true, status: "rejected", message: "Kurang bayar — ditolak otomatis. Silakan upload bukti susulan." });
    }
    if (result.amount > order.price) {
      // Kelebihan bayar → review manual + hubungi seller untuk melaporkan (SPEC-07-01)
      await db.receipt.update({ where: { id: receipt.id }, data: { matchStatus: "overpaid" } });
      await addEvent(order.id, "payment_submitted", "Nominal lebih dari harga — review manual", "ai");
      await notifyUser({
        userId: store.ownerId,
        type: "order_update",
        title: `Review manual: ${order.code} (kelebihan bayar)`,
        body: `Nominal Rp${result.amount.toLocaleString("id-ID")} lebih dari harga. Buyer mengirim kelebihan — laporkan ke platform bila perlu.`,
        linkQuery: `v=dashboard&tab=orders`,
      });
      return json({
        ok: true,
        status: "payment_submitted",
        verifyPath: "manual",
        message: "Nominal lebih dari harga — ditandai untuk review manual oleh seller.",
      });
    }

    // Lolos semua aturan → verified (AI path), nama pengirim hanya info pendukung (SPEC-07-03)
    await verifyOrder({ orderId: order.id, actor: "ai", note: `Scanner ${store.aiProvider} (${usedKey ?? "zai"}) — nominal cocok` });
    return json({
      ok: true,
      status: "verified",
      message: "Verifikasi berhasil — status Lunas. File bisa diunduh dari Koleksi Saya.",
      extracted: { amount: result.amount, senderName: result.senderName, transferAt: result.transferAt },
    });
  });
}
