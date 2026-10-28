// POST /api/seller/onboarding — 4 langkah, draft tersimpan otomatis (SPEC-06-01/05)
// GET  — status onboarding toko (checklist "Toko Anda X% siap")
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle, validateSlug, validateWhatsApp } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { notifyUser } from "@/lib/server/notifications";

const stepSchema = z.object({
  step: z.number().int().min(1).max(4),
  // Step 1: profil toko
  name: z.string().min(3).max(60).optional(),
  slug: z.string().min(3).max(30).optional(),
  description: z.string().max(500).optional(),
  whatsapp: z.string().optional(),
  // Step 2: QR (base64)
  qrBase64: z.string().optional(),
  qrVerified: z.boolean().optional(),
  // Step 3: API key (semi-optional, SPEC-06-03)
  aiProvider: z.enum(["gemini", "zai"]).optional(),
  aiKeyPrimary: z.string().optional(),
  aiKeyFallback: z.string().optional(),
  skipKey: z.boolean().optional(),
});

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const store = await db.store.findUnique({ where: { ownerId: user.id } });
    return json({ store });
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req);
    if (user.isSuperAdmin) return fail("Super-Admin tidak membuka toko.", 400);
    const parsed = stepSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak valid.", 422);
    const { step } = parsed.data;

    let store = await db.store.findUnique({ where: { ownerId: user.id } });

    // ---------- Langkah 1: profil toko (nama, slug permanen, deskripsi, WA) ----------
    if (step === 1) {
      if (store) return fail("Toko sudah dibuat — slug bersifat permanen (SPEC-02-01).", 409);
      const slugCheck = validateSlug(parsed.data.slug ?? "");
      if (!slugCheck.ok) return fail(slugCheck.error, 422);
      const waCheck = validateWhatsApp(parsed.data.whatsapp ?? "");
      if (!waCheck.ok) return fail(waCheck.error, 422);
      const slugTaken = await db.store.findUnique({ where: { slug: parsed.data.slug } });
      if (slugTaken) return fail("Slug sudah dipakai toko lain.", 409, "SLUG_TAKEN");
      const steps = [true, false, false, false];
      store = await db.store.create({
        data: {
          ownerId: user.id,
          name: parsed.data.name ?? "",
          slug: parsed.data.slug ?? "",
          description: parsed.data.description ?? "",
          whatsapp: waCheck.normalized,
          status: "preparing",
          onboardingStepsJson: JSON.stringify(steps),
        },
      });
      await notifyUser({
        userId: user.id,
        type: "system",
        title: "Toko dibuat",
        body: `Slug ${store.slug} permanen dan tidak bisa diubah. Lanjut ke langkah 2: unggah QR pembayaran.`,
        linkQuery: "v=onboarding&step=2",
      });
      return json({ ok: true, store });
    }

    if (!store) return fail("Selesaikan langkah 1 dulu.", 400);
    const steps = JSON.parse(store.onboardingStepsJson || "[false,false,false,false]") as boolean[];

    // ---------- Langkah 2: QR pembayaran (SPEC-06-02) ----------
    if (step === 2) {
      if (!parsed.data.qrBase64) return fail("Gambar QR wajib diunggah.", 422);
      if (parsed.data.qrVerified !== true) {
        return fail("Centang pernyataan bahwa QR sudah kamu uji scan dan nominal masuk ke rekeningmu.", 422);
      }
      const { putObject, convertToWebp } = await import("@/lib/server/storage");
      const buf = Buffer.from(parsed.data.qrBase64, "base64");
      if (buf.length > 2 * 1024 * 1024) return fail("QR maksimal 2 MB (JPG/PNG).", 422);
      let webp: Buffer;
      try {
        webp = await convertToWebp(buf, 800);
      } catch {
        return fail("File bukan gambar valid.", 422);
      }
      const objectPath = `qr/${store.slug}-${Date.now()}.webp`;
      await putObject("public", objectPath, webp, "image/webp");
      steps[1] = true;
      store = await db.store.update({
        where: { id: store.id },
        data: {
          qrPath: `public/${objectPath}`,
          qrVerified: true,
          onboardingStepsJson: JSON.stringify(steps),
          // GAP-08: setup inti selesai → "Siap" TANPA wajib produk pertama
          status: steps[2] !== undefined && steps[0] && steps[1] ? "ready" : store.status,
        },
      });
      return json({ ok: true, store });
    }

    // ---------- Langkah 3: API key AI semi-optional (SPEC-06-03, SPEC-07-08) ----------
    if (step === 3) {
      const { encryptSecret, maskKey } = await import("@/lib/server/crypto");
      const { testKey } = await import("@/lib/server/scanner");
      const data: Record<string, unknown> = {};
      if (parsed.data.aiProvider) data.aiProvider = parsed.data.aiProvider;

      if (!parsed.data.skipKey && parsed.data.aiKeyPrimary) {
        // Validasi 1 panggilan test murah saat disimpan (SPEC-07-08)
        const valid = await testKey(parsed.data.aiProvider ?? "gemini", parsed.data.aiKeyPrimary);
        if (!valid && parsed.data.aiProvider === "gemini") {
          return fail("API key primer gagal validasi. Pastikan key aktif di Google AI Studio, atau pilih Lewati.", 422, "KEY_INVALID");
        }
        data.aiKeyPrimaryEnc = encryptSecret(parsed.data.aiKeyPrimary);
        data.aiKeyPrimaryMask = maskKey(parsed.data.aiKeyPrimary);
        if (parsed.data.aiKeyFallback) {
          const validF = await testKey(parsed.data.aiProvider ?? "gemini", parsed.data.aiKeyFallback);
          if (!validF && parsed.data.aiProvider === "gemini") {
            return fail("API key fallback gagal validasi.", 422, "KEY_INVALID");
          }
          data.aiKeyFallbackEnc = encryptSecret(parsed.data.aiKeyFallback);
          data.aiKeyFallbackMask = maskKey(parsed.data.aiKeyFallback);
        }
      }
      if (parsed.data.skipKey) {
        // Lewati diperbolehkan — konsekuensi: semua order approve manual
        data.aiProvider = parsed.data.aiProvider ?? store.aiProvider;
      }
      steps[2] = true;
      store = await db.store.update({
        where: { id: store.id },
        data: { ...data, onboardingStepsJson: JSON.stringify(steps), status: "ready" },
      });
      return json({
        ok: true,
        store,
        consequence: parsed.data.skipKey ? "Semua order harus Anda approve manual." : null,
      });
    }

    // ---------- Langkah 4: produk pertama opsional (GAP-08) — CTA dari layar selesai ----------
    if (step === 4) {
      steps[3] = true;
      store = await db.store.update({
        where: { id: store.id },
        data: { onboardingStepsJson: JSON.stringify(steps) },
      });
      return json({ ok: true, store });
    }
    return fail("Langkah tidak dikenal.", 400);
  });
}
