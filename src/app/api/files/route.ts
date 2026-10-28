// GET /api/files — penyajian objek storage (public langsung, private via signed URL
// berumur 1 jam — SPEC-07-06, GAP-19)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fail, handle } from "@/lib/server/helpers";
import { getObject, verifyFileSignature } from "@/lib/server/storage";

const MIME: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export async function GET(req: NextRequest) {
  return handle(async () => {
    const sp = req.nextUrl.searchParams;
    const bucket = sp.get("bucket") === "private" ? "private" : "public";
    const path = sp.get("path") || "";
    if (!path || path.includes("..")) return fail("Path tidak valid.", 400);

    if (bucket === "private") {
      const exp = sp.get("exp") || "";
      const sig = sp.get("sig") || "";
      if (!verifyFileSignature(bucket, path, exp, sig)) {
        return fail("Tautan file kedaluwarsa atau tidak valid.", 403);
      }
    }

    const data = await getObject(bucket, path);
    if (!data) return fail("File tidak ditemukan.", 404);
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    const mime = MIME[ext] ?? "application/octet-stream";

    // Bukti transfer private tidak boleh di-cache panjang
    const isReceipt = path.startsWith("receipts/");
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": isReceipt ? "private, no-store" : "public, max-age=86400",
      },
    });
  });
}

// Fallback agar route tidak dianggap module kosong oleh beberapa tooling
export async function HEAD() {
  return new Response(null, { status: 204 });
}
void db;
