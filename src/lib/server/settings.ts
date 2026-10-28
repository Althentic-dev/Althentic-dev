// Althentic.Dev - Platform settings singleton (SPEC-01-05..07, SPEC-09-04)

import { db } from "@/lib/db";

export interface PlatformSettingsData {
  commissionAmount: number;
  invoiceThreshold: number;
  suspendThreshold: number;
  waTemplate: string;
  tosVersion: string;
}

const DEFAULT_WA_TEMPLATE =
  "Halo {nama_toko}, saya {nama_buyer}. Order {id_order} untuk produk {nama_produk} sebesar {jumlah} - bukti transfer saya gagal diverifikasi otomatis. Mohon verifikasi manual ya. Terima kasih!";

export async function getSettings(): Promise<PlatformSettingsData> {
  let row = await db.platformSettings.findUnique({ where: { id: "singleton" } });
  if (!row) {
    row = await db.platformSettings.create({
      data: {
        id: "singleton",
        commissionAmount: 1000,
        invoiceThreshold: 25000,
        suspendThreshold: 25000,
        waTemplate: DEFAULT_WA_TEMPLATE,
        tosVersion: "2026-10-27",
      },
    });
  }
  return {
    commissionAmount: row.commissionAmount,
    invoiceThreshold: row.invoiceThreshold,
    suspendThreshold: row.suspendThreshold,
    waTemplate: row.waTemplate || DEFAULT_WA_TEMPLATE,
    tosVersion: row.tosVersion,
  };
}

export async function updateSettings(patch: Partial<PlatformSettingsData>): Promise<PlatformSettingsData> {
  await getSettings(); // pastikan row ada
  await db.platformSettings.update({
    where: { id: "singleton" },
    data: patch,
  });
  return getSettings();
}

/** Render template WhatsApp fallback (SPEC-01-07) dengan placeholder sumber. */
export function renderWaTemplate(
  template: string,
  vars: {
    nama_buyer: string;
    nama_produk: string;
    jumlah: string;
    slug_toko: string;
    id_order: string;
    nama_toko: string;
  }
): string {
  return template.replace(/\{(nama_buyer|nama_produk|jumlah|slug_toko|id_order|nama_toko)\}/g, (_, k) => vars[k as keyof typeof vars] ?? "");
}
