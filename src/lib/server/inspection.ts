// =============================================================================
// Althentic.Dev - Inspeksi produk (Konteks Terkunci, SPEC-08-01/02, SPEC-15-07)
// Skrip Node.js: cek link Drive via fetch HTTP biasa (bukan browser penuh),
// status HTTP live demo, ukuran .zip, hash file, timestamp → laporan Markdown.
// Screenshot via API screenshot (urlbox/screenshotone free-tier - GAP-19);
// bila tidak dikonfigurasi, laporan mencatat "dilewati" dengan anggun.
// =============================================================================

import { db } from "@/lib/db";
import { hashBuffer, demoProvider, googleDriveProvider } from "@/lib/server/delivery";
import { notifyUser } from "@/lib/server/notifications";
import { tplProductRejected } from "@/lib/server/email";
import { safeFetchPublic } from "@/lib/server/safe-fetch";

export interface InspectionOutcome {
  reportId: string;
  autoRejected: boolean;
  reason?: string;
}

async function checkDriveLink(driveFileId: string): Promise<{
  status: "ok" | "404" | "private" | "unreachable";
  httpStatus?: number;
  size?: number;
  hash?: string;
}> {
  if (driveFileId.startsWith("demo:")) {
    // Demo provider: file dibangkitkan lokal - selalu OK
    const r = await demoProvider.fetchFile({ driveFileId, fileName: "demo.zip" });
    const buf = Buffer.from(r.body as Buffer);
    return { status: "ok", size: buf.length, hash: hashBuffer(buf) };
  }
  try {
    const url = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveFileId)}`;
    const res = await safeFetchPublic(url, { maxBytes: 100 * 1024 * 1024, timeoutMs: 15_000 });
    if (res.status === 404) return { status: "404", httpStatus: 404 };
    if (res.status === 403) return { status: "private", httpStatus: 403 };
    if (res.status < 200 || res.status >= 300) return { status: "unreachable", httpStatus: res.status };
    return { status: "ok", httpStatus: res.status, size: res.body.length, hash: hashBuffer(res.body) };
  } catch {
    return { status: "unreachable" };
  }
}

async function checkLiveDemo(url: string): Promise<{ httpStatus: number | null; ok: boolean; finalUrl: string | null }> {
  try {
    const res = await safeFetchPublic(url, { maxBytes: 2 * 1024 * 1024, timeoutMs: 15_000 });
    return { httpStatus: res.status, ok: res.status < 500, finalUrl: res.url.toString() };
  } catch {
    return { httpStatus: null, ok: false, finalUrl: null };
  }
}

/** Screenshot desktop via API screenshot (GAP-19: urlbox / screenshotone). */
async function takeScreenshot(url: string): Promise<{ path: string; data: Buffer } | null> {
  const urlboxKey = process.env.URLBOX_KEY;
  const screenshotoneKey = process.env.SCREENSHOTONE_KEY;
  try {
    if (urlboxKey) {
      const full = `https://api.urlbox.io/v1/${urlboxKey}/png?url=${encodeURIComponent(url)}&full_page=false&width=1440`;
      const res = await safeFetchPublic(full, { maxBytes: 10 * 1024 * 1024, timeoutMs: 20_000 });
      if (res.status >= 200 && res.status < 300) {
        return { path: `screenshots/${Date.now()}.png`, data: res.body };
      }
    }
    if (screenshotoneKey) {
      const full = `https://api.screenshotone.com/take?access_key=${screenshotoneKey}&url=${encodeURIComponent(url)}&viewport_width=1440&format=png`;
      const res = await safeFetchPublic(full, { maxBytes: 10 * 1024 * 1024, timeoutMs: 20_000 });
      if (res.status >= 200 && res.status < 300) {
        return { path: `screenshots/${Date.now()}.png`, data: res.body };
      }
    }
  } catch {
    /* screenshot opsional */
  }
  return null;
}

export async function runInspection(p: {
  productId: string;
  trigger: "submission" | "reinspection" | "link_change";
}): Promise<InspectionOutcome> {
  const product = await db.product.findUnique({
    where: { id: p.productId },
    include: { store: { include: { owner: true } } },
  });
  if (!product) throw Object.assign(new Error("Produk tidak ditemukan."), { status: 404 });

  const sellTypes = JSON.parse(product.sellTypesJson) as {
    type: string;
    price: number;
    driveFileId?: string;
  }[];
  const requiresDemo = sellTypes.some((s) => s.type === "template" || s.type === "bundle");
  const firstDrive = sellTypes.find((s) => s.driveFileId)?.driveFileId ?? "";

  const now = new Date();
  const drive = firstDrive ? await checkDriveLink(firstDrive) : { status: "404" as const };
  const demo = requiresDemo && product.liveDemoUrl
    ? await checkLiveDemo(product.liveDemoUrl)
    : null;

  // Screenshot live demo (opsional, dilewati bila provider tidak dikonfigurasi)
  let screenshotPath: string | null = null;
  if (requiresDemo && demo?.finalUrl) {
    const shot = await takeScreenshot(demo.finalUrl);
    if (shot) {
      const { putObject } = await import("@/lib/server/storage");
      await putObject("private", shot.path, shot.data, "image/png");
      screenshotPath = `private/${shot.path}`;
    }
  }

  const lines: string[] = [];
  lines.push(`# Laporan Inspeksi Produk - ${product.title}`);
  lines.push("");
  lines.push(`- **Produk:** ${product.title} (\`${product.slug}\`)`);
  lines.push(`- **Toko:** ${product.store.name} (\`${product.store.slug}\`)`);
  lines.push(`- **Pemicu:** ${p.trigger}`);
  lines.push(`- **Timestamp inspeksi:** ${now.toISOString()}`);
  lines.push("");
  lines.push(`## 1. Status link Google Drive`);
  lines.push(`- Hasil: **${drive.status.toUpperCase()}**${drive.httpStatus ? ` (HTTP ${drive.httpStatus})` : ""}`);
  lines.push("");
  lines.push(`## 2. Live demo`);
  if (!requiresDemo) {
    lines.push(`- Tipe jual tidak menyertakan template jadi - live demo tidak diwajibkan.`);
  } else if (!product.liveDemoUrl) {
    lines.push(`- **Live demo belum diisi** (wajib untuk tipe yang menyertakan template jadi).`);
  } else {
    lines.push(
      `- URL: \`${product.liveDemoUrl.replace(/https?:\/\//, "")}\` - HTTP **${demo?.httpStatus ?? "tidak terjangkau"}**`
    );
    lines.push(screenshotPath ? `- Screenshot desktop: tersimpan (${screenshotPath})` : `- Screenshot desktop: dilewati (provider screenshot tidak aktif - SPEC-15-07)`);
  }
  lines.push("");
  lines.push(`## 3. File .zip`);
  lines.push(`- Ukuran: ${drive.size ? `${(drive.size / 1024).toFixed(1)} KB` : "tidak terbaca"}`);
  lines.push(`- Hash SHA-256: \`${drive.hash ?? "-"}\``);
  lines.push("");
  lines.push(`## 4. Kesimpulan otomatis`);
  const driveDead = drive.status === "404" || drive.status === "private";
  const demoDead = demo ? demo.httpStatus !== null && demo.httpStatus >= 500 : false;
  const missingDemo = requiresDemo && !product.liveDemoUrl;
  const autoReject = driveDead || demoDead || missingDemo;
  if (autoReject) {
    const reasons: string[] = [];
    if (driveDead) reasons.push(`link Drive ${drive.status}`);
    if (demoDead) reasons.push(`live demo HTTP ${demo?.httpStatus}`);
    if (missingDemo) reasons.push("live demo wajib belum diisi");
    lines.push(`- **REJECT OTOMATIS** - ${reasons.join("; ")} (SPEC-08-02)`);
  } else {
    lines.push(`- Lolos pemeriksaan teknis - menunggu review Super-Admin (moderasi legalitas & keamanan, GAP-07).`);
  }

  const report = await db.inspectionReport.create({
    data: {
      productId: product.id,
      markdown: lines.join("\n"),
      driveStatus: drive.status,
      demoHttpStatus: demo?.httpStatus ?? null,
      zipSize: drive.size ?? null,
      fileHash: drive.hash ?? null,
      screenshotPath,
      trigger: p.trigger,
    },
  });

  // Audit trail (SPEC-08-06)
  await db.auditLog.create({
    data: {
      actorType: "system",
      action: "inspect",
      productId: product.id,
      inspectionId: report.id,
      payloadJson: JSON.stringify({
        drive: drive.status,
        demo: demo?.httpStatus ?? null,
        trigger: p.trigger,
      }),
      decision: autoReject ? "auto_reject" : "needs_review",
    },
  });

  if (autoReject) {
    const reason =
      driveDead
        ? `Link Google Drive ${drive.status === "404" ? "tidak ditemukan (404)" : "private / tidak publik"}`
        : demoDead
          ? `Live demo merespons HTTP ${demo?.httpStatus} (>= 500)`
          : "Live demo wajib belum diisi untuk tipe yang menyertakan template jadi";
    await db.product.update({
      where: { id: product.id },
      data: { status: "rejected", rejectedReason: reason, rejectedAt: now },
    });
    await notifyUser({
      userId: product.store.ownerId,
      type: "verification_result",
      title: `Produk ditolak: ${product.title}`,
      body: `${reason} - gunakan "Perbaiki & Kirim Ulang" (tenggat 14 hari).`,
      linkQuery: `v=dashboard&tab=products`,
      email: {
        to: product.store.owner.email,
        subject: `Produk ditolak: ${product.title}`,
        body: tplProductRejected({ sellerName: product.store.name, productTitle: product.title, reason }),
        kind: "product_rejected",
      },
    });
    return { reportId: report.id, autoRejected: true, reason };
  }

  await db.product.update({
    where: { id: product.id },
    data: { status: "pending_verification", zipSize: drive.size ?? null, fileHash: drive.hash ?? null },
  });
  // Notifikasi email ke Super-Admin (Konteks Terkunci - Nodemailer)
  const admin = await db.user.findFirst({ where: { isSuperAdmin: true } });
  if (admin) {
    await notifyUser({
      userId: admin.id,
      type: "verification_result",
      title: `Produk menunggu verifikasi: ${product.title}`,
      body: `Toko ${product.store.name} - laporan inspeksi siap ditinjau.`,
      linkQuery: `v=admin&tab=verifications`,
      email: {
        to: admin.email,
        subject: `[Verifikasi] ${product.title} dari ${product.store.name}`,
        body: `Produk "${product.title}" dari toko ${product.store.name} telah lolos inspeksi teknis dan menunggu review kamu.\n\nBuka Dashboard Super-Admin → Verifikasi Produk.`,
        kind: "admin_verification_needed",
      },
    });
  }
  return { reportId: report.id, autoRejected: false };
}

/** Keputusan final Super-Admin (approve/reject) + audit (SPEC-08-05/06). */
export async function decideVerification(p: {
  productId: string;
  decision: "approve" | "reject";
  reason?: string;
  superAdminId: string;
}) {
  const product = await db.product.findUnique({
    where: { id: p.productId },
    include: { store: { include: { owner: true } } },
  });
  if (!product) throw Object.assign(new Error("Produk tidak ditemukan."), { status: 404 });
  const latest = await db.inspectionReport.findFirst({
    where: { productId: product.id },
    orderBy: { createdAt: "desc" },
  });

  if (p.decision === "approve") {
    await db.product.update({
      where: { id: product.id },
      data: { status: "active", rejectedReason: null, rejectedAt: null },
    });
    // Toko live begitu punya produk terverifikasi (SPEC-06-04)
    if (product.store.status === "ready" || product.store.status === "preparing") {
      await db.store.update({ where: { id: product.storeId }, data: { status: "live" } });
    }
    await notifyUser({
      userId: product.store.ownerId,
      type: "verification_result",
      title: `Produk aktif: ${product.title}`,
      body: "Produkmu lolos verifikasi dan sudah tampil di katalog publik.",
      linkQuery: `v=product&id=${product.slug}`,
      email: {
        to: product.store.owner.email,
        subject: `Produk aktif: ${product.title}`,
        body: `Selamat! Produk "${product.title}" sudah aktif dan tampil di katalog Althentic.Dev.`,
        kind: "product_approved",
      },
    });
  } else {
    await db.product.update({
      where: { id: product.id },
      data: { status: "rejected", rejectedReason: p.reason ?? "Tidak memenuhi kebijakan konten", rejectedAt: new Date() },
    });
    await notifyUser({
      userId: product.store.ownerId,
      type: "verification_result",
      title: `Produk ditolak: ${product.title}`,
      body: `${p.reason ?? "Tidak memenuhi kebijakan konten"} - gunakan "Perbaiki & Kirim Ulang" (tenggat 14 hari).`,
      linkQuery: `v=dashboard&tab=products`,
      email: {
        to: product.store.owner.email,
        subject: `Produk ditolak: ${product.title}`,
        body: tplProductRejected({
          sellerName: product.store.name,
          productTitle: product.title,
          reason: p.reason ?? "Tidak memenuhi kebijakan konten",
        }),
        kind: "product_rejected",
      },
    });
  }

  await db.auditLog.create({
    data: {
      actorType: "superadmin",
      actorId: p.superAdminId,
      action: p.decision === "approve" ? "approve" : "reject",
      productId: product.id,
      inspectionId: latest?.id ?? null,
      payloadJson: JSON.stringify({ title: product.title, store: product.store.slug }),
      decision: p.decision,
      reason: p.reason ?? null,
      createdById: p.superAdminId,
    },
  });
}
