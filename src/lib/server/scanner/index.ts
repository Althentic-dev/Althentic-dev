// =============================================================================
// Althentic.Dev - AI Receipt Scanner (Konteks Terkunci, SPEC-07-01..10, GAP-12)
// BYOK: primary + fallback key. Timeout 15 detik per request, retry 1x sebelum
// fallback ke key kedua. Pencocokan berbasis data TERSTRUKTUR hasil ekstraksi
// (nominal, tanggal, nama pengirim) - bukan perceptual hash gambar.
// Data tersimpan: nominal, tanggal/waktu, nama pengirim, status match -
// TANPA raw response penuh dari AI provider (GAP-12).
// Provider: gemini (BYOK, production) | zai (VLM platform, aktif di sandbox).
// =============================================================================

import { createHash } from "crypto";

export interface ScanResult {
  ok: boolean;
  amount: number | null;
  transferAt: Date | null;
  senderName: string | null;
  manipulationSuspected: boolean;
  notes?: string;
}

export interface ScannerInput {
  imageBase64: string; // tanpa prefix data:
  mimeType: string;
}

export interface ScannerProvider {
  id: string;
  scan(input: ScannerInput, apiKey?: string): Promise<ScanResult>;
}

const SCAN_PROMPT = `Kamu adalah AI Receipt Scanner untuk verifikasi bukti transfer bank / e-wallet Indonesia.
Analisis gambar bukti transfer ini dan ekstrak data terstruktur.

Balas HANYA dengan JSON valid (tanpa penjelasan lain) dengan skema:
{
  "is_receipt": true/false,
  "amount": number (angka rupiah tanpa titik/koma, null jika tidak terbaca),
  "transfer_at": "ISO 8601 atau null" (tanggal & waktu transaksi yang tertera),
  "sender_name": "string atau null" (nama pengirim jika terbaca),
  "manipulation_suspected": true/false (indikasi edit: font tidak konsisten, artefak penyuntingan, angka nominal tampak di-edit, metadata mencurigakan),
  "notes": "string singkat" (indikasi spesifik jika ada)
}`;

function parseScannerJson(raw: string): ScanResult {
  // Ekstrak blok JSON dari respons (tahan terhadap markdown fence)
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return { ok: false, amount: null, transferAt: null, senderName: null, manipulationSuspected: false, notes: "respons tidak terstruktur" };
  }
  try {
    const j = JSON.parse(match[0]);
    let transferAt: Date | null = null;
    if (j.transfer_at) {
      const d = new Date(j.transfer_at);
      if (!isNaN(d.getTime())) transferAt = d;
    }
    return {
      ok: j.is_receipt === true,
      amount: typeof j.amount === "number" ? j.amount : null,
      transferAt,
      senderName: typeof j.sender_name === "string" ? j.sender_name : null,
      manipulationSuspected: j.manipulation_suspected === true,
      notes: typeof j.notes === "string" ? j.notes : undefined,
    };
  } catch {
    return { ok: false, amount: null, transferAt: null, senderName: null, manipulationSuspected: false, notes: "gagal parse" };
  }
}

// ---------------- Provider: Z.AI VLM (backend only) ----------------

export const zaiProvider: ScannerProvider = {
  id: "zai",
  async scan(input): Promise<ScanResult> {
    const { default: ZAI } = await import("z-ai-web-dev-sdk");
    const zai = await ZAI.create();
    const res = await zai.chat.completions.createVision({
      model: "glm-4.6v",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: SCAN_PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:${input.mimeType};base64,${input.imageBase64}` },
            },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });
    const content = res.choices[0]?.message?.content ?? "";
    return parseScannerJson(content);
  },
};

// ---------------- Provider: Gemini (BYOK, Google AI Studio) ----------------

export const geminiProvider: ScannerProvider = {
  id: "gemini",
  async scan(input, apiKey): Promise<ScanResult> {
    if (!apiKey) throw new Error("API key Gemini tidak tersedia.");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SCAN_PROMPT },
                { inline_data: { mime_type: input.mimeType, data: input.imageBase64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(SCANNER_TIMEOUT_MS),
      }
    );
    if (!res.ok) {
      throw new Error(`Gemini error ${res.status}`);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return parseScannerJson(text);
  },
};

// ---------------- Chain dengan timeout + retry (GAP-12) ----------------

export const SCANNER_TIMEOUT_MS = 15_000; // 15 detik per request
const RETRY = 1; // retry 1x sebelum fallback key kedua

async function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

export interface StoreKeys {
  provider: string; // gemini | zai
  primary?: string | null;
  fallback?: string | null;
}

/**
 * Jalankan scanner dengan rantai: primary key (retry 1x) → fallback key (retry 1x).
 * Provider "zai" memakai VLM platform dan mengabaikan key.
 */
export async function runScanner(
  input: ScannerInput,
  keys: StoreKeys
): Promise<{ result: ScanResult; usedKey: "primary" | "fallback" | "zai" | null; failed: boolean }> {
  const provider = keys.provider === "gemini" ? geminiProvider : zaiProvider;

  if (provider.id === "zai") {
    for (let attempt = 0; attempt <= RETRY; attempt++) {
      try {
        const result = await withTimeout(() => provider.scan(input), SCANNER_TIMEOUT_MS);
        return { result, usedKey: "zai", failed: false };
      } catch (err) {
        if (attempt === RETRY) {
          return { result: failResult((err as Error).message), usedKey: "zai", failed: true };
        }
      }
    }
  }

  // Gemini BYOK chain
  const chain: { label: "primary" | "fallback"; key: string | null }[] = [
    { label: "primary", key: keys.primary ?? null },
    { label: "fallback", key: keys.fallback ?? null },
  ];
  let lastError = "";
  for (const slot of chain) {
    if (!slot.key) continue;
    for (let attempt = 0; attempt <= RETRY; attempt++) {
      try {
        const result = await withTimeout(
          () => provider.scan(input, slot.key ?? undefined),
          SCANNER_TIMEOUT_MS
        );
        return { result, usedKey: slot.label, failed: false };
      } catch (err) {
        lastError = (err as Error).message;
      }
    }
  }
  return { result: failResult(lastError || "kedua key gagal"), usedKey: null, failed: true };
}

function failResult(reason: string): ScanResult {
  return { ok: false, amount: null, transferAt: null, senderName: null, manipulationSuspected: false, notes: reason };
}

/** Validasi key saat disimpan - satu panggilan test murah (SPEC-07-08). */
export async function testKey(provider: string, apiKey: string): Promise<boolean> {
  try {
    if (provider === "zai") return true; // provider platform, tanpa BYOK
    const tiny = Buffer.from("1x1").toString("base64"); // payload minimal
    if (provider === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }, { inline_data: { mime_type: "image/png", data: tiny } }] }],
          }),
          signal: AbortSignal.timeout(12_000),
        }
      );
      return res.ok;
    }
    return false;
  } catch {
    return false;
  }
}

/** File hash untuk deteksi bukti duplikat (SPEC-07-04). */
export function fileHash(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}
