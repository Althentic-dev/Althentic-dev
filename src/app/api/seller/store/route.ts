// GET/PUT /api/seller/store — branding & settings toko (SPEC-02-02..04, SPEC-07-09)
// PUT /api/seller/store/key — rotasi API key (key lama langsung nonaktif)
import { NextRequest } from "next/server";
import { z } from "zod";
import sharp from "sharp";
import { db } from "@/lib/db";
import { json, fail, handle, validateWhatsApp } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { putObject, convertToWebp } from "@/lib/server/storage";
import { encryptSecret, maskKey } from "@/lib/server/crypto";
import { testKey } from "@/lib/server/scanner";

async function myStore(userId: string, isSuperAdmin: boolean) {
  const store = await db.store.findUnique({ where: { ownerId: userId } });
  if (!store && !isSuperAdmin) {
    throw Object.assign(new Error("Kamu belum membuka toko."), { status: 404 });
  }
  return store;
}

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const store = await myStore(user.id, user.isSuperAdmin);
    const { fileUrl } = await import("@/lib/server/storage");
    return json({
      store: store
        ? {
            id: store.id,
            name: store.name,
            slug: store.slug,
            description: store.description,
            accentPreset: store.accentPreset,
            bannerUrl: store.bannerPath ? fileUrl("public", store.bannerPath.replace(/^public\//, "")) : null,
            qrUrl: store.qrPath ? fileUrl("public", store.qrPath.replace(/^public\//, "")) : null,
            qrVerified: store.qrVerified,
            whatsapp: store.whatsapp,
            socialIg: store.socialIg,
            socialX: store.socialX,
            socialTiktok: store.socialTiktok,
            status: store.status,
            onboardingSteps: JSON.parse(store.onboardingStepsJson || "[]"),
            aiProvider: store.aiProvider,
            aiKeyPrimaryMask: store.aiKeyPrimaryMask,
            aiKeyFallbackMask: store.aiKeyFallbackMask,
            aiKeyFailCount: store.aiKeyFailCount,
            commissionCredit: store.commissionCredit,
            suspendReason: store.suspendReason,
          }
        : null,
    });
  });
}

const putSchema = z.object({
  name: z.string().min(3).max(60).optional(),
  description: z.string().max(500).optional(),
  accentPreset: z.number().int().min(0).max(7).optional(),
  whatsapp: z.string().optional(),
  socialIg: z.string().max(60).optional().nullable(),
  socialX: z.string().max(60).optional().nullable(),
  socialTiktok: z.string().max(60).optional().nullable(),
  bannerBase64: z.string().optional(),
  qrBase64: z.string().optional(),
  qrVerified: z.boolean().optional(),
  aiProvider: z.enum(["gemini", "zai"]).optional(),
});

export async function PUT(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req);
    const store = await myStore(user.id, false);
    if (!store) return fail("Toko tidak ditemukan.", 404);
    const parsed = putSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak valid.", 422);
    const data: Record<string, unknown> = {};

    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.accentPreset !== undefined) data.accentPreset = parsed.data.accentPreset;
    if (parsed.data.whatsapp !== undefined) {
      const wa = validateWhatsApp(parsed.data.whatsapp);
      if (!wa.ok) return fail(wa.error, 422);
      data.whatsapp = wa.normalized;
    }
    if (parsed.data.socialIg !== undefined) data.socialIg = parsed.data.socialIg || null;
    if (parsed.data.socialX !== undefined) data.socialX = parsed.data.socialX || null;
    if (parsed.data.socialTiktok !== undefined) data.socialTiktok = parsed.data.socialTiktok || null;
    if (parsed.data.aiProvider !== undefined) data.aiProvider = parsed.data.aiProvider;

    // Banner 1600x400 rasio 4:1 → crop cover, konversi webp (SPEC-02-03)
    if (parsed.data.bannerBase64) {
      const buf = Buffer.from(parsed.data.bannerBase64, "base64");
      if (buf.length > 2 * 1024 * 1024) return fail("Banner maksimal 2 MB (JPG/PNG).", 422);
      try {
        const resized = await sharp(buf)
          .resize({ width: 1600, height: 400, fit: "cover", position: "centre" })
          .webp({ quality: 82 })
          .toBuffer();
        const objectPath = `banners/${store.slug}-${Date.now()}.webp`;
        await putObject("public", objectPath, resized, "image/webp");
        data.bannerPath = `public/${objectPath}`;
      } catch {
        return fail("File banner tidak valid.", 422);
      }
    }
    if (parsed.data.qrBase64) {
      if (parsed.data.qrVerified !== true) {
        return fail("Centang pernyataan QR sudah diuji scan.", 422);
      }
      const buf = Buffer.from(parsed.data.qrBase64, "base64");
      if (buf.length > 2 * 1024 * 1024) return fail("QR maksimal 2 MB.", 422);
      try {
        const webp = await convertToWebp(buf, 800);
        const objectPath = `qr/${store.slug}-${Date.now()}.webp`;
        await putObject("public", objectPath, webp, "image/webp");
        data.qrPath = `public/${objectPath}`;
        data.qrVerified = true;
      } catch {
        return fail("File QR tidak valid.", 422);
      }
    }

    const updated = await db.store.update({ where: { id: store.id }, data });
    return json({ ok: true, store: { id: updated.id, name: updated.name } });
  });
}

// Rotasi key (SPEC-07-09): key lama langsung nonaktif
const keySchema = z.object({
  aiProvider: z.enum(["gemini", "zai"]).optional(),
  aiKeyPrimary: z.string().min(8).optional(),
  aiKeyFallback: z.string().min(8).optional().nullable(),
});

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req);
    const store = await myStore(user.id, false);
    if (!store) return fail("Toko tidak ditemukan.", 404);
    const parsed = keySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("Key tidak valid.", 422);

    const data: Record<string, unknown> = { aiKeyFailCount: 0 };
    if (parsed.data.aiProvider) data.aiProvider = parsed.data.aiProvider;
    if (parsed.data.aiKeyPrimary) {
      if (parsed.data.aiProvider !== "zai") {
        const valid = await testKey(parsed.data.aiProvider ?? store.aiProvider, parsed.data.aiKeyPrimary);
        if (!valid && (parsed.data.aiProvider ?? store.aiProvider) === "gemini") {
          return fail("Key primer gagal validasi (panggilan test).", 422, "KEY_INVALID");
        }
      }
      data.aiKeyPrimaryEnc = encryptSecret(parsed.data.aiKeyPrimary);
      data.aiKeyPrimaryMask = maskKey(parsed.data.aiKeyPrimary);
    }
    if (parsed.data.aiKeyFallback === null) {
      data.aiKeyFallbackEnc = null;
      data.aiKeyFallbackMask = null;
    } else if (parsed.data.aiKeyFallback) {
      if (parsed.data.aiProvider !== "zai") {
        const valid = await testKey(parsed.data.aiProvider ?? store.aiProvider, parsed.data.aiKeyFallback);
        if (!valid && (parsed.data.aiProvider ?? store.aiProvider) === "gemini") {
          return fail("Key fallback gagal validasi.", 422, "KEY_INVALID");
        }
      }
      data.aiKeyFallbackEnc = encryptSecret(parsed.data.aiKeyFallback);
      data.aiKeyFallbackMask = maskKey(parsed.data.aiKeyFallback);
    }
    await db.store.update({ where: { id: store.id }, data });
    return json({ ok: true, message: "Key diperbarui — key lama langsung nonaktif." });
  });
}
