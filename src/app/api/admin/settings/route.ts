// GET/PUT /api/admin/settings - Settings Super-Admin (SPEC-01-05..07, SPEC-09-04)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireSuperAdmin } from "@/lib/server/auth";
import { getSettings, updateSettings, renderWaTemplate } from "@/lib/server/settings";
import type { PlatformSettingsDTO } from "@/lib/types";

export async function GET(req: Request) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const settings = await getSettings();
    const dto: PlatformSettingsDTO = settings;
    return json({ settings: dto });
  });
}

const schema = z.object({
  commissionAmount: z.number().int().min(0).max(1000000).optional(), // hanya transaksi baru (SPEC-01-05)
  invoiceThreshold: z.number().int().min(1000).max(100000000).optional(),
  suspendThreshold: z.number().int().min(1000).max(100000000).optional(),
  waTemplate: z.string().max(600).optional(),
});

export async function PUT(req: NextRequest) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak valid.", 422);
    const updated = await updateSettings(parsed.data);
    return json({ ok: true, settings: updated });
  });
}

// POST - "Uji pratinjau" template WA (SPEC-01-07): render contoh pesan
export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const body = (await req.json().catch(() => null)) as { waTemplate?: string } | null;
    const settings = await getSettings();
    const preview = renderWaTemplate(body?.waTemplate ?? settings.waTemplate, {
      nama_buyer: "Bayu Pembeli",
      nama_produk: "Super Prompt Riset Pasar",
      jumlah: "Rp59.000",
      slug_toko: "althentic-studio",
      id_order: "ALT-DEMO01",
      nama_toko: "Althentic Studio",
    });
    return json({ preview });
  });
}

void db;
