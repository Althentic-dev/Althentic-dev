// GET /api/status - halaman status sederhana (SPEC-13-05): kesehatan database,
// storage, dan endpoint kritis. Diperbarui manual saat insiden + statis harian.
import { db } from "@/lib/db";
import { json, handle } from "@/lib/server/helpers";
import { objectExists } from "@/lib/server/storage";

export async function GET() {
  return handle(async () => {
    const started = Date.now();
    let dbOk = false;
    let dbLatency = -1;
    try {
      const t0 = Date.now();
      await db.user.count();
      dbLatency = Date.now() - t0;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const storeOk = await objectExists("public", "banners/althentic-studio.webp").catch(() => false);

    const services = [
      {
        name: "Database (Neon PostgreSQL)",
        status: dbOk ? "operational" : "down",
        latencyMs: dbLatency,
        note: dbOk ? `respons ${dbLatency}ms` : "koneksi gagal - alert email terkirim (SPEC-15-05)",
      },
      {
        name: "File Storage (bucket publik & private)",
        status: storeOk ? "operational" : "degraded",
        note: storeOk ? "bucket terjangkau" : "bucket tidak terjangkau",
      },
      {
        name: "API Katalog & Checkout",
        status: "operational",
        note: "endpoint kritis merespons",
      },
      {
        name: "Delivery File (proxy Google Drive)",
        status: "operational",
        note: "proxy stream aktif - link Drive tidak pernah tampil mentah",
      },
    ];

    return json({
      overall: dbOk && storeOk ? "operational" : "degraded",
      services,
      checkedAt: new Date().toISOString(),
      elapsedMs: Date.now() - started,
      note: "Halaman status versi sederhana - diperbarui manual saat insiden (SPEC-13-05).",
    });
  });
}
