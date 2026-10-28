// =============================================================================
// Althentic.Dev — Delivery file (GAP-02 final: PROXY/STREAM, bukan redirect!)
// API Route men-stream file .zip dari Google Drive dengan header
// Content-Disposition: attachment — link Drive TIDAK PERNAH tampil mentah
// (SPEC-04-05, SPEC-11-02). Interface tunggal (SPEC-16-04) → ganti provider
// cukup 1 file.
// Sandbox: driveFileId berformat "demo:*" dilayani DemoZipProvider (file dibuat
// on-the-fly) agar alur unduh E2E dapat diverifikasi tanpa Drive eksternal.
// =============================================================================

import { createHash } from "crypto";
import { db } from "@/lib/db";

// ---------------- Minimal ZIP writer (store, no compression) ----------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function buildZip(files: { name: string; content: string }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const f of files) {
    const nameBuf = Buffer.from(f.name, "utf8");
    const data = Buffer.from(f.content, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(0, 8); // store
    local.writeUInt16LE(0, 10); // time
    local.writeUInt16LE(0x21, 12); // date (1996-01-01-ish, valid DOS date)
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += 30 + nameBuf.length + data.length;
  }
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  const centralSize = centrals.reduce((a, b) => a + b.length, 0);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, ...centrals, eocd]);
}

// ---------------- Demo ZIP content builder ----------------

function promptReadme(p: {
  productTitle: string;
  storeName: string;
  version: number;
  sellType: string;
  promptContent: string;
}): { name: string; content: string }[] {
  return [
    {
      name: "README.txt",
      content: `${p.productTitle}
Dari toko: ${p.storeName} (Althentic.Dev)
Versi file: v${p.version} — Tipe: ${p.sellType}

LISENSI (SPEC-16-10):
- Lisensi penggunaan personal dan komersial atas OUTPUT prompt.
- DILARANG menjual ulang atau mendistribusikan file prompt mentah.

Kuota unduh order ini: 1x (sudah terpakai saat file ini diunduh).
Butuh bantuan? Buka Dokumentasi > Panduan Buyer > Eksekusi Prompt.
`,
    },
    {
      name: "prompt-utama.md",
      content: p.promptContent,
    },
    {
      name: "cara-pakai.md",
      content: `# Cara Pakai

1. Salin isi prompt-utama.md
2. Tempel ke AI tool pilihanmu (ChatGPT, Claude, Gemini, dsb.)
3. Sesuaikan bagian [KONTEKS KAMU] dengan kebutuhanmu
4. Iterasi — mulai dari prompt dasar lalu tambahkan batasan

Dokumentasi lengkap: menu Dokumentasi di Althentic.Dev
`,
    },
  ];
}

// ---------------- Delivery provider interface (SPEC-16-04) ----------------

export interface DeliveryResult {
  body: ReadableStream<Uint8Array> | Buffer;
  fileName: string;
  contentType: string;
  contentLength?: number;
}

export interface DeliveryProvider {
  id: string;
  fetchFile(input: { driveFileId: string; fileName: string }): Promise<DeliveryResult>;
}

// ---- Google Drive provider (production path, direct download uc?export) ----
export const googleDriveProvider: DeliveryProvider = {
  id: "gdrive",
  async fetchFile({ driveFileId, fileName }) {
    const url = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveFileId)}`;
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok || !res.body) {
      throw Object.assign(new Error("File di Google Drive tidak dapat diakses."), { status: 502 });
    }
    return {
      body: res.body,
      fileName,
      contentType: "application/zip",
      contentLength: res.headers.get("content-length")
        ? Number(res.headers.get("content-length"))
        : undefined,
    };
  },
};

// ---- Demo provider (sandbox E2E verification) ----
export const demoProvider: DeliveryProvider = {
  id: "demo",
  async fetchFile({ fileName }) {
    const zip = buildZip(
      promptReadme({
        productTitle: fileName.replace(/\.zip$/, ""),
        storeName: "Althentic Demo Delivery",
        version: 1,
        sellType: "prompt",
        promptContent: `# Prompt Utama

## Peran (Role)
Kamu adalah senior product designer dengan 10 tahun pengalaman...

## Tugas (Task)
Rancang landing page konversi tinggi untuk SaaS B2B...

## Konteks
[KONTEKS KAMU — ganti dengan deskripsi produkmu]

## Format Output
- Struktur section lengkap
- Copy headline + subheadline per section

## Batasan
- Maksimal 6 section
- Bahasa Indonesia

## Contoh
Headline: "Kurangi waktu riset 70% dengan prompt terkurasi"

## Tone/Gaya
Profesional, ringkas, meyakinkan.
`,
      })
    );
    return { body: zip, fileName, contentType: "application/zip", contentLength: zip.length };
  },
};

export async function deliverForOrder(p: {
  orderId: string;
}): Promise<DeliveryResult | null> {
  const order = await db.order.findUnique({
    where: { id: p.orderId },
    include: { product: true },
  });
  if (!order) return null;
  const sellTypes = JSON.parse(order.product.sellTypesJson) as {
    type: string;
    driveFileId?: string;
  }[];
  const st = sellTypes.find((s) => s.type === order.sellType);
  const driveFileId = st?.driveFileId || "";
  const fileName = `${order.product.slug}-v${order.product.version}-${order.sellType}.zip`;

  if (driveFileId.startsWith("demo:")) {
    return demoProvider.fetchFile({ driveFileId, fileName });
  }
  if (!driveFileId) return null;
  return googleDriveProvider.fetchFile({ driveFileId, fileName });
}

/** Hash file untuk inspeksi (SPEC-08-01). */
export function hashBuffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}
