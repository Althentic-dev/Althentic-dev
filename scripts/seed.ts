// =============================================================================
// Althentic.Dev — Seed data (dijalankan: bun scripts/seed.ts)
// Membuat: Super-Admin, 3 toko (pemilik platform + 2 seller), 14 produk dengan
// preview webp, QR demo, banner 4:1, order berbagai status, review, invoice
// komisi, notifikasi, changelog. Semua alur E2E dapat diverifikasi.
// =============================================================================

import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes, createHash } from "crypto";
import { readFile, mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function randomCode(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${s}`;
}

const STORAGE = "/home/z/my-project/storage";
const GEN = "/home/z/my-project/.gen-assets";

async function putPublic(objectPath: string, data: Buffer) {
  const full = path.join(STORAGE, "public", objectPath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return `public/${objectPath}`;
}

async function toWebp(file: string, opts?: { width?: number; height?: number; crop?: boolean }) {
  const buf = await readFile(path.join(GEN, file));
  let img = sharp(buf);
  if (opts?.crop && opts.width && opts.height) {
    img = img.resize({ width: opts.width, height: opts.height, fit: "cover", position: "centre" });
  } else if (opts?.width) {
    img = img.resize({ width: opts.width, withoutEnlargement: true });
  }
  return img.webp({ quality: 82 }).toBuffer();
}

/** QR demo — pola visual deterministik (bukan QR scannable; environment sandbox). */
async function makeQr(seedStr: string): Promise<Buffer> {
  const N = 29;
  const cell = 10;
  const size = N * cell;
  const h = createHash("sha256").update(seedStr).digest();
  const isFinder = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
    return inBox(0, 0) || inBox(0, N - 7) || inBox(N - 7, 0);
  };
  const modules: boolean[][] = [];
  for (let r = 0; r < N; r++) {
    modules[r] = [];
    for (let c = 0; c < N; c++) {
      if (isFinder(r, c)) {
        const rr = r < 7 ? r : r - (N - 7);
        const cc = c < 7 ? c : c - (N - 7);
        const ring = Math.max(Math.abs(rr - 3), Math.abs(cc - 3));
        modules[r][c] = ring !== 2;
      } else {
        modules[r][c] = h[(r * N + c) % h.length] % 3 === 0;
      }
    }
  }
  let rects = "";
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (modules[r][c]) {
        rects += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}"/>`;
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#ffffff"/><g fill="#0a1a3c">${rects}</g></svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 90 }).toBuffer();
}

async function main() {
  console.log("Seeding Althentic.Dev ...");

  await db.$transaction([
    db.notification.deleteMany(),
    db.emailOutbox.deleteMany(),
    db.downloadLog.deleteMany(),
    db.orderEvent.deleteMany(),
    db.disputeEvent.deleteMany(),
    db.dispute.deleteMany(),
    db.report.deleteMany(),
    db.review.deleteMany(),
    db.commissionLedger.deleteMany(),
    db.invoice.deleteMany(),
    db.receipt.deleteMany(),
    db.auditLog.deleteMany(),
    db.inspectionReport.deleteMany(),
    db.order.deleteMany(),
    db.product.deleteMany(),
    db.store.deleteMany(),
    db.verificationToken.deleteMany(),
    db.session.deleteMany(),
    db.generatorExport.deleteMany(),
    db.promptCanvas.deleteMany(),
    db.mcpToken.deleteMany(),
    db.changelogEntry.deleteMany(),
    db.user.deleteMany(),
    db.platformSettings.deleteMany(),
  ]);

  // ---------- Settings ----------
  await db.platformSettings.create({
    data: {
      id: "singleton",
      commissionAmount: 1000,
      invoiceThreshold: 25000,
      suspendThreshold: 25000,
      waTemplate:
        "Halo {nama_toko}, saya {nama_buyer}. Order {id_order} untuk produk {nama_produk} sebesar {jumlah} — bukti transfer saya gagal diverifikasi otomatis. Mohon verifikasi manual ya. Terima kasih!",
      tosVersion: "2026-10-27",
    },
  });

  // ---------- Users ----------
  const admin = await db.user.create({
    data: {
      email: process.env.SUPER_ADMIN_EMAIL || "admin@althentic.dev",
      name: process.env.SUPER_ADMIN_NAME || "Super Admin Althentic",
      passwordHash: hashPassword(process.env.SUPER_ADMIN_INITIAL_PASSWORD || "AlthenticAdmin2026!"),
      isSuperAdmin: true,
      emailVerifiedAt: new Date(),
      tosVersion: "2026-10-27",
      tosConsentedAt: new Date(),
      ageConfirmedAt: new Date(),
    },
  });

  const owner = await db.user.create({
    data: {
      email: "owner@althentic.dev",
      name: "Al Thentic",
      passwordHash: hashPassword("OwnerToko2026!"),
      emailVerifiedAt: new Date(),
      tosVersion: "2026-10-27",
      tosConsentedAt: new Date(),
      ageConfirmedAt: new Date(),
    },
  });
  const seller2 = await db.user.create({
    data: {
      email: "seller2@althentic.dev",
      name: "Prima Promptworks",
      passwordHash: hashPassword("Seller2Toko2026!"),
      emailVerifiedAt: new Date(),
      tosVersion: "2026-10-27",
      tosConsentedAt: new Date(),
      ageConfirmedAt: new Date(),
    },
  });
  const seller3 = await db.user.create({
    data: {
      email: "seller3@althentic.dev",
      name: "Karya Nadia",
      passwordHash: hashPassword("Seller3Toko2026!"),
      emailVerifiedAt: new Date(),
      tosVersion: "2026-10-27",
      tosConsentedAt: new Date(),
      ageConfirmedAt: new Date(),
    },
  });
  const buyer = await db.user.create({
    data: {
      email: "buyer@althentic.dev",
      name: "Bayu Pembeli",
      passwordHash: hashPassword("BuyerDemo2026!"),
      emailVerifiedAt: new Date(),
      tosVersion: "2026-10-27",
      tosConsentedAt: new Date(),
      ageConfirmedAt: new Date(),
    },
  });
  const buyer2 = await db.user.create({
    data: {
      email: "rina@althentic.dev",
      name: "Rina Marlina",
      passwordHash: hashPassword("RinaDemo2026!"),
      emailVerifiedAt: new Date(),
      tosVersion: "2026-10-27",
      tosConsentedAt: new Date(),
      ageConfirmedAt: new Date(),
    },
  });

  // ---------- Stores ----------
  const banner1 = await putPublic("banners/althentic-studio.webp", await toWebp("b01.png", { crop: true, width: 1600, height: 400 }));
  const banner2 = await putPublic("banners/promptworks.webp", await toWebp("b02.png", { crop: true, width: 1600, height: 400 }));
  const banner3 = await putPublic("banners/karya-prompt.webp", await toWebp("b03.png", { crop: true, width: 1600, height: 400 }));
  const qr1 = await putPublic("qr/althentic-studio.webp", await makeQr("althentic-studio"));
  const qr2 = await putPublic("qr/promptworks.webp", await makeQr("promptworks"));
  const qr3 = await putPublic("qr/karya-prompt.webp", await makeQr("karya-prompt"));

  const store1 = await db.store.create({
    data: {
      ownerId: owner.id,
      name: "Althentic Studio",
      slug: "althentic-studio",
      description:
        "Toko resmi pemilik platform Althentic.Dev. Prompt & template terkurasi kualitas terbaik — dirilis gratis berkala untuk komunitas AI Indonesia.",
      accentPreset: 0,
      bannerPath: banner1,
      qrPath: qr1,
      qrVerified: true,
      whatsapp: "6281234500001",
      socialIg: "althentic.dev",
      socialX: "althenticdev",
      socialTiktok: "althentic.dev",
      status: "live",
      onboardingStepsJson: JSON.stringify([true, true, true, true]),
      aiProvider: "zai", // provider VLM platform (aktif di sandbox; production: gemini BYOK)
    },
  });
  const store2 = await db.store.create({
    data: {
      ownerId: seller2.id,
      name: "PromptWorks ID",
      slug: "promptworks",
      description:
        "Prompt riset & SEO buatan praktisi. Fokus data-driven: keyword, kompetitor, dan artikel long-form yang ranking.",
      accentPreset: 4,
      bannerPath: banner2,
      qrPath: qr2,
      qrVerified: true,
      whatsapp: "6281234500002",
      socialIg: "promptworks.id",
      socialX: "promptworksid",
      status: "live",
      onboardingStepsJson: JSON.stringify([true, true, true, true]),
      aiProvider: "zai",
    },
  });
  const store3 = await db.store.create({
    data: {
      ownerId: seller3.id,
      name: "Karya Prompt",
      slug: "karya-prompt",
      description:
        "Prompt edukasi & belajar terstruktur. Dibuat guru & instruktur — untuk pelajar, mahasiswa, dan lifelong learner.",
      accentPreset: 2,
      bannerPath: banner3,
      qrPath: qr3,
      qrVerified: true,
      whatsapp: "6281234500003",
      socialTiktok: "karyaprompt",
      status: "live",
      onboardingStepsJson: JSON.stringify([true, true, true, true]),
      aiProvider: "zai",
    },
  });

  // ---------- Products ----------
  interface SeedProduct {
    slug: string;
    title: string;
    store: "althentic-studio" | "promptworks" | "karya-prompt";
    category: string;
    img: string;
    sellTypes: { type: string; price: number; driveFileId: string }[];
    demo?: string;
    desc: string;
  }

  const products: SeedProduct[] = [
    {
      slug: "landing-page-saas-converter",
      title: "Landing Page SaaS Converter — Template Next.js",
      store: "althentic-studio",
      category: "website",
      img: "p01.png",
      sellTypes: [
        { type: "template", price: 149000, driveFileId: "demo:saas-template" },
        { type: "prompt", price: 49000, driveFileId: "demo:saas-prompt" },
        { type: "bundle", price: 189000, driveFileId: "demo:saas-bundle" },
      ],
      demo: "https://vercel.com",
      desc: "Template landing page SaaS siap deploy: hero konversi tinggi, section fitur glassmorphism, pricing, FAQ, dan CTA ganda. Termasuk prompt arsitektur konten di tipe Prompt. Live demo tersedia untuk tipe Template & Bundle.",
    },
    {
      slug: "prompt-arsitektur-aplikasi-fullstack",
      title: "Prompt Arsitektur Aplikasi Full-Stack",
      store: "althentic-studio",
      category: "website",
      img: "p02.png",
      sellTypes: [{ type: "prompt", price: 39000, driveFileId: "demo:arch-prompt" }],
      desc: "Prompt terstruktur untuk merancang arsitektur aplikasi full-stack bersama AI: pemilihan stack, skema database, kontrak API, hingga rencana migrasi. Cocok untuk proyek baru maupun refactor.",
    },
    {
      slug: "super-prompt-riset-pasar",
      title: "Super Prompt Riset Pasar Komprehensif",
      store: "althentic-studio",
      category: "research",
      img: "p03.png",
      sellTypes: [{ type: "prompt", price: 59000, driveFileId: "demo:riset-pasar" }],
      desc: "Riset pasar 360 derajat dengan satu prompt: ukuran pasar, segmentasi, pain point, positioning, dan go-to-market. Output terstruktur siap dipakai untuk pitch deck.",
    },
    {
      slug: "prompt-analisis-kompetitor",
      title: "Prompt Analisis Kompetitor Mendalam",
      store: "althentic-studio",
      category: "research",
      img: "p04.png",
      sellTypes: [{ type: "prompt", price: 45000, driveFileId: "demo:kompetitor" }],
      desc: "Bedah kompetitor secara sistematis: fitur, harga, kanal, messaging, dan celah diferensiasi. Termasuk framework output tabel perbandingan.",
    },
    {
      slug: "prompt-riset-cepat-gratis",
      title: "Prompt Gratis: Riset Cepat 10 Menit",
      store: "althentic-studio",
      category: "research",
      img: "p10.png",
      sellTypes: [{ type: "prompt", price: 0, driveFileId: "demo:riset-gratis" }],
      desc: "Rilis gratis dari toko pemilik platform (strategi konten dulu — SPEC-16-08). Prompt riset kilat untuk validasi ide sebelum membangun. Gratis, tanpa komisi.",
    },
    {
      slug: "tutor-personal-bahasa-inggris",
      title: "Tutor Personal Bahasa Inggris + Materi",
      store: "karya-prompt",
      category: "education",
      img: "p05.png",
      sellTypes: [{ type: "prompt", price: 29000, driveFileId: "demo:tutor-bahasa" }],
      desc: "Prompt tutor personal: kurikulum 30 hari adaptif, drill percakapan, koreksi grammar menjelaskan aturan, dan evaluasi mingguan. Dilengkapi template tracking progres.",
    },
    {
      slug: "prompt-rangkuman-flashcard",
      title: "Prompt Rangkuman & Flashcard Otomatis",
      store: "karya-prompt",
      category: "education",
      img: "p06.png",
      sellTypes: [{ type: "prompt", price: 19000, driveFileId: "demo:flashcard" }],
      desc: "Ubah materi apa pun menjadi rangkuman terstruktur + flashcard spaced repetition siap impor ke Anki. Mendukung berbagai mata pelajaran.",
    },
    {
      slug: "copywriting-30-headline",
      title: "Copywriting Landing Page: 30 Headline",
      store: "althentic-studio",
      category: "content",
      img: "p07.png",
      sellTypes: [{ type: "prompt", price: 35000, driveFileId: "demo:headline" }],
      desc: "Generator 30 headline berdasarkan framework copywriting klasik (AIDA, PAS, USP) dengan skor konversi dan variasi A/B test.",
    },
    {
      slug: "kalender-konten-ig-30-hari",
      title: "Kalender Konten IG 30 Hari",
      store: "althentic-studio",
      category: "content",
      img: "p08.png",
      sellTypes: [{ type: "prompt", price: 25000, driveFileId: "demo:kalender-ig" }],
      desc: "Prompt menyusun kalender konten Instagram 30 hari lengkap: hook, format, CTA, hashtag, dan ide visual per hari. Sesuaikan dengan niche-mu.",
    },
    {
      slug: "prompt-desain-ui-dashboard",
      title: "Prompt Desain UI Dashboard Glassmorphism",
      store: "althentic-studio",
      category: "design",
      img: "p09.png",
      sellTypes: [{ type: "prompt", price: 55000, driveFileId: "demo:ui-dashboard" }],
      desc: "Prompt detail untuk mendesain dashboard glassmorphism di AI image tool & UI builder: token warna, grid, komponen, sampai dark mode.",
    },
    {
      slug: "prompt-ilustrasi-isometrik",
      title: "Prompt Ilustrasi Isometrik Konsisten",
      store: "althentic-studio",
      category: "design",
      img: "p10.png",
      sellTypes: [{ type: "prompt", price: 45000, driveFileId: "demo:isometrik" }],
      desc: "Rumus prompt ilustrasi isometrik dengan gaya konsisten lintas aset: palet, pencahayaan, sudut kamera, dan komposisi cluster.",
    },
    {
      slug: "company-profile-bundle",
      title: "Website Company Profile — Bundle Template + Prompt",
      store: "promptworks",
      category: "website",
      img: "p11.png",
      sellTypes: [
        { type: "template", price: 99000, driveFileId: "demo:cp-template" },
        { type: "bundle", price: 129000, driveFileId: "demo:cp-bundle" },
      ],
      demo: "https://example.com",
      desc: "Company profile profesional siap isi konten. Bundle menambahkan prompt pengisi konten per section (tentang, layanan, portofolio, kontak).",
    },
    {
      slug: "prompt-keyword-riset-seo",
      title: "Prompt Keyword Riset SEO Bulanan",
      store: "promptworks",
      category: "research",
      img: "p12.png",
      sellTypes: [{ type: "prompt", price: 19000, driveFileId: "demo:keyword-seo" }],
      desc: "Riset keyword bulanan terstruktur: intent, volume estimasi, kesulitan, dan pemetaan halaman. Output tabel siap spreadsheet.",
    },
    {
      slug: "prompt-artikel-seo-longform",
      title: "Prompt Artikel SEO Long-Form",
      store: "promptworks",
      category: "content",
      img: "p13.png",
      sellTypes: [{ type: "prompt", price: 29000, driveFileId: "demo:artikel-seo" }],
      desc: "Tulis artikel 2000+ kata yang ramah SEO: struktur H2/H3, entity SEO, internal link plan, dan meta description.",
    },
    {
      slug: "prompt-belajar-coding-12-minggu",
      title: "Prompt Belajar Coding Terstruktur 12 Minggu",
      store: "karya-prompt",
      category: "education",
      img: "p14.png",
      sellTypes: [{ type: "prompt", price: 39000, driveFileId: "demo:belajar-coding" }],
      desc: "Kurikulum belajar coding 12 minggu adaptif: jalur frontend/backend, proyek mingguan, review kode oleh AI, dan assessment akhir.",
    },
  ];

  const storeBySlug = { "althentic-studio": store1, promptworks: store2, "karya-prompt": store3 };
  const productIds: Record<string, string> = {};
  let previewIdx = 0;
  for (const p of products) {
    const webp = await toWebp(p.img, { width: 1200 });
    const previewPath = await putPublic(`products/${p.slug}/preview-1.webp`, webp);
    const previewPath2 = await putPublic(`products/${p.slug}/preview-2.webp`, await toWebp(p.img, { width: 640 }));
    const sellTypesCsv = p.sellTypes.map((s) => s.type).join(",");
    const minPrice = Math.min(...p.sellTypes.map((s) => s.price));
    const created = await db.product.create({
      data: {
        storeId: storeBySlug[p.store].id,
        title: p.title,
        slug: p.slug,
        description: p.desc,
        category: p.category,
        sellTypesJson: JSON.stringify(p.sellTypes),
        sellTypesCsv,
        minPrice,
        previewPathsJson: JSON.stringify([previewPath, previewPath2]),
        liveDemoUrl: p.demo ?? null,
        status: "active",
        zipSize: 45000 + previewIdx * 7211,
        fileHash: randomBytes(32).toString("hex"),
        createdAt: new Date(Date.now() - (40 - previewIdx * 2) * 24 * 3600 * 1000),
      },
    });
    productIds[p.slug] = created.id;
    previewIdx++;
  }

  // Laporan inspeksi + audit untuk produk pertama (contoh audit trail)
  const firstProduct = await db.product.findUnique({ where: { id: productIds["landing-page-saas-converter"] } });
  if (firstProduct) {
    const report = await db.inspectionReport.create({
      data: {
        productId: firstProduct.id,
        markdown: `# Laporan Inspeksi Produk — ${firstProduct.title}\n\n- **Toko:** Althentic Studio\n- **Pemicu:** submission\n- **Timestamp inspeksi:** ${new Date(Date.now() - 38 * 24 * 3600 * 1000).toISOString()}\n\n## 1. Status link Google Drive\n- Hasil: **OK** (HTTP 200)\n\n## 2. Live demo\n- HTTP **200** — screenshot desktop tersimpan\n\n## 3. File .zip\n- Ukuran: 52.2 KB\n- Hash SHA-256: \`${firstProduct.fileHash}\`\n\n## 4. Kesimpulan otomatis\n- Lolos pemeriksaan teknis — menunggu review Super-Admin.`,
        driveStatus: "ok",
        demoHttpStatus: 200,
        zipSize: firstProduct.zipSize,
        fileHash: firstProduct.fileHash,
        trigger: "submission",
        createdAt: new Date(Date.now() - 38 * 24 * 3600 * 1000),
      },
    });
    await db.auditLog.create({
      data: {
        actorType: "system",
        action: "inspect",
        productId: firstProduct.id,
        inspectionId: report.id,
        payloadJson: JSON.stringify({ drive: "ok", demo: 200 }),
        decision: "needs_review",
        createdAt: report.createdAt,
      },
    });
    await db.auditLog.create({
      data: {
        actorType: "superadmin",
        actorId: admin.id,
        action: "approve",
        productId: firstProduct.id,
        inspectionId: report.id,
        payloadJson: JSON.stringify({ title: firstProduct.title, store: "althentic-studio" }),
        decision: "approve",
        reason: "Legalitas & keamanan lolos — link hidup, deskripsi tidak menipu (GAP-07).",
        createdById: admin.id,
        createdAt: new Date(Date.now() - 37 * 24 * 3600 * 1000),
      },
    });
  }

  // ---------- Orders ----------
  const daysAgo = (d: number, h = 0) => new Date(Date.now() - d * 24 * 3600 * 1000 - h * 3600 * 1000);

  async function seedOrder(p: {
    buyerId: string;
    productSlug: string;
    sellType: string;
    status: string;
    verifyPath?: string;
    verified?: boolean;
    createdDaysAgo: number;
    commission?: number;
    events?: { status: string; label: string; actor: string; note?: string }[];
    ledger?: boolean;
    downloadUsed?: boolean;
  }) {
    const product = await db.product.findUnique({ where: { id: productIds[p.productSlug] } });
    if (!product) return null;
    const sellTypes = JSON.parse(product.sellTypesJson) as { type: string; price: number }[];
    const price = sellTypes.find((s) => s.type === p.sellType)?.price ?? 0;
    const order = await db.order.create({
      data: {
        code: randomCode("ALT"),
        buyerId: p.buyerId,
        storeId: product.storeId,
        productId: product.id,
        sellType: p.sellType,
        price,
        commissionSnapshot: p.commission ?? 1000,
        status: p.status,
        verifyPath: p.verifyPath ?? null,
        expiresAt: new Date(Date.now() + (24 - p.createdDaysAgo * 24) * 3600 * 1000),
        paySessionStartedAt: daysAgo(p.createdDaysAgo, 1),
        verifiedAt: p.verified ? daysAgo(p.createdDaysAgo) : null,
        completedAt: p.downloadUsed ? daysAgo(p.createdDaysAgo, -2) : null,
        downloadUsedAt: p.downloadUsed ? daysAgo(p.createdDaysAgo, -2) : null,
        createdAt: daysAgo(p.createdDaysAgo),
      },
    });
    const events = p.events ?? [
      { status: "pending_payment", label: "Order dibuat", actor: "buyer" },
      { status: "payment_submitted", label: "Bukti transfer diterima", actor: "buyer" },
      ...(p.verified ? [{ status: "verified", label: "Diverifikasi AI Receipt Scanner", actor: "ai" }] : []),
      ...(p.downloadUsed ? [{ status: "completed", label: "File diunduh (kuota 1x terpakai)", actor: "buyer" }] : []),
    ];
    for (const e of events) {
      await db.orderEvent.create({
        data: { orderId: order.id, status: e.status, label: e.label, actor: e.actor, note: e.note ?? null, createdAt: order.createdAt },
      });
    }
    if (p.ledger && p.verified) {
      await db.commissionLedger.create({
        data: {
          storeId: product.storeId,
          orderId: order.id,
          amount: p.commission ?? 1000,
          status: "open",
          createdAt: daysAgo(p.createdDaysAgo),
        },
      });
      await db.product.update({ where: { id: product.id }, data: { salesCount: { increment: 1 } } });
    }
    return order;
  }

  await seedOrder({ buyerId: buyer.id, productSlug: "super-prompt-riset-pasar", sellType: "prompt", status: "completed", verified: true, verifyPath: "ai", createdDaysAgo: 5, ledger: true, downloadUsed: true });
  await seedOrder({ buyerId: buyer.id, productSlug: "copywriting-30-headline", sellType: "prompt", status: "completed", verified: true, verifyPath: "ai", createdDaysAgo: 4, ledger: true, downloadUsed: true });
  await seedOrder({ buyerId: buyer.id, productSlug: "kalender-konten-ig-30-hari", sellType: "prompt", status: "verified", verified: true, verifyPath: "ai", createdDaysAgo: 2, ledger: true });
  await seedOrder({ buyerId: buyer.id, productSlug: "prompt-keyword-riset-seo", sellType: "prompt", status: "payment_submitted", verifyPath: "ai", createdDaysAgo: 0 });
  await seedOrder({ buyerId: buyer2.id, productSlug: "tutor-personal-bahasa-inggris", sellType: "prompt", status: "payment_submitted", verifyPath: "manual", createdDaysAgo: 0 });
  await seedOrder({ buyerId: buyer2.id, productSlug: "prompt-artikel-seo-longform", sellType: "prompt", status: "payment_submitted", verifyPath: "wa", createdDaysAgo: 1 });
  await seedOrder({ buyerId: buyer.id, productSlug: "landing-page-saas-converter", sellType: "prompt", status: "pending_payment", createdDaysAgo: 0 });
  await seedOrder({
    buyerId: buyer2.id, productSlug: "prompt-desain-ui-dashboard", sellType: "prompt", status: "cancelled", createdDaysAgo: 6,
    events: [
      { status: "pending_payment", label: "Order dibuat", actor: "buyer" },
      { status: "cancelled", label: "Dibatalkan buyer", actor: "buyer", note: "Dibatalkan oleh buyer" },
    ],
  });
  await seedOrder({
    buyerId: buyer2.id, productSlug: "prompt-rangkuman-flashcard", sellType: "prompt", status: "expired", createdDaysAgo: 3,
    events: [
      { status: "pending_payment", label: "Order dibuat", actor: "buyer" },
      { status: "expired", label: "Kedaluwarsa (24 jam tanpa progres)", actor: "system" },
    ],
  });
  await seedOrder({ buyerId: buyer2.id, productSlug: "super-prompt-riset-pasar", sellType: "prompt", status: "completed", verified: true, verifyPath: "ai", createdDaysAgo: 3, ledger: true, downloadUsed: true });
  await seedOrder({ buyerId: buyer2.id, productSlug: "prompt-ilustrasi-isometrik", sellType: "prompt", status: "completed", verified: true, verifyPath: "ai", createdDaysAgo: 6, ledger: true, downloadUsed: true });

  // ---------- Reviews ----------
  async function addReview(p: {
    productSlug: string;
    userId: string;
    rating: number;
    text: string;
    reply?: string;
    daysAgo: number;
  }) {
    const product = await db.product.findUnique({ where: { id: productIds[p.productSlug] } });
    if (!product) return;
    const order = await db.order.findFirst({
      where: { productId: product.id, buyerId: p.userId, status: { in: ["verified", "completed"] } },
    });
    if (!order) return;
    await db.review.create({
      data: {
        orderId: order.id,
        productId: product.id,
        userId: p.userId,
        rating: p.rating,
        text: p.text,
        replyText: p.reply ?? null,
        repliedAt: p.reply ? daysAgo(Math.max(0, p.daysAgo - 0.2)) : null,
        createdAt: daysAgo(p.daysAgo),
      },
    });
  }

  await addReview({ productSlug: "super-prompt-riset-pasar", userId: buyer.id, rating: 5, text: "Riset pasar jadi jauh lebih cepat. Outputnya terstruktur dan langsung bisa dipakai buat pitch. Recommended!", daysAgo: 4 });
  await addReview({ productSlug: "super-prompt-riset-pasar", userId: buyer2.id, rating: 5, text: "Prompt-nya detail banget, semua framework riset yang biasanya saya bayar konsultan sekarang bisa jalan sendiri.", reply: "Terima kasih! Selalu update blok konteksnya agar hasil makin personal.", daysAgo: 3 });
  await addReview({ productSlug: "copywriting-30-headline", userId: buyer.id, rating: 4, text: "Headline variasinya beragam. Beberapa perlu di-polish lagi, tapi kerangka AIDA-nya sangat membantu.", daysAgo: 3 });
  await addReview({ productSlug: "prompt-ilustrasi-isometrik", userId: buyer2.id, rating: 5, text: "Konsistensi isometriknya juara — aset untuk landing page jadi satu paket visual.", daysAgo: 5 });

  // Refresh rating produk & toko
  const allProducts = await db.product.findMany({ include: { reviews: true } });
  for (const p of allProducts) {
    const valid = p.reviews.filter((r) => !r.flagged && !r.deletedAt);
    if (valid.length) {
      const avg = valid.reduce((a, r) => a + r.rating, 0) / valid.length;
      await db.product.update({
        where: { id: p.id },
        data: { ratingAvg: Math.round(avg * 10) / 10, ratingCount: valid.length },
      });
    }
  }
  for (const store of [store1, store2, store3]) {
    const prods = await db.product.findMany({ where: { storeId: store.id }, select: { ratingAvg: true, ratingCount: true } });
    const total = prods.reduce((a, p) => a + p.ratingCount, 0);
    const avg = total ? prods.reduce((a, p) => a + p.ratingAvg * p.ratingCount, 0) / total : 0;
    const count = await db.product.count({ where: { storeId: store.id, status: "active" } });
    await db.store.update({
      where: { id: store.id },
      data: { ratingAvg: Math.round(avg * 10) / 10, ratingCount: total, productCount: count },
    });
  }

  // ---------- Ledger tambahan + Invoice PromptWorks (outstanding) ----------
  const pwOpen0 = await db.commissionLedger.count({ where: { storeId: store2.id, status: "open" } });
  const extraNeeded = 27 - pwOpen0;
  for (let i = 0; i < Math.max(0, extraNeeded); i++) {
    await seedOrder({
      buyerId: i % 2 === 0 ? buyer.id : buyer2.id,
      productSlug: i % 2 === 0 ? "prompt-keyword-riset-seo" : "prompt-artikel-seo-longform",
      sellType: "prompt", status: "completed", verified: true, verifyPath: "ai",
      createdDaysAgo: 20 + i, ledger: true, downloadUsed: true,
    });
  }
  const pwEntries = await db.commissionLedger.findMany({ where: { storeId: store2.id, status: "open" }, orderBy: { createdAt: "asc" } });
  const invAmount = pwEntries.reduce((a, e) => a + e.amount, 0);
  if (invAmount >= 25000) {
    const issuedAt = daysAgo(5);
    const dueAt = new Date(issuedAt.getTime() + 7 * 24 * 3600 * 1000);
    const suspendAt = new Date(dueAt);
    suspendAt.setHours(0, 0, 0, 0);
    const inv = await db.invoice.create({
      data: {
        code: randomCode("INV"),
        storeId: store2.id,
        amount: invAmount,
        issuedAt,
        dueAt,
        suspendAt,
        status: "outstanding",
        remindersJson: JSON.stringify([1, 3]),
      },
    });
    await db.commissionLedger.updateMany({
      where: { id: { in: pwEntries.map((e) => e.id) } },
      data: { status: "invoiced", invoiceId: inv.id },
    });
    await db.emailOutbox.createMany({
      data: [
        { toEmail: seller2.email, subject: `Invoice komisi ${inv.code} — Rp${invAmount.toLocaleString("id-ID")}`, body: "Invoice komisi terbit otomatis saat threshold Rp25.000 tercapai. Batas suspend: " + suspendAt.toLocaleDateString("id-ID"), kind: "invoice_issued", status: "logged", createdAt: issuedAt },
        { toEmail: seller2.email, subject: `Pengingat invoice ${inv.code} — hari ke-1`, body: "Tunggakan belum lunas. Suspend otomatis bila belum bayar pada hari ke-8.", kind: "invoice_reminder", status: "logged", createdAt: daysAgo(4) },
        { toEmail: seller2.email, subject: `Pengingat invoice ${inv.code} — hari ke-3`, body: "Tunggakan belum lunas. Banner kuning tampil di dashboard seller saat tersisa 3 hari.", kind: "invoice_reminder", status: "logged", createdAt: daysAgo(2) },
      ],
    });
    await db.notification.create({
      data: {
        userId: seller2.id,
        type: "invoice",
        title: `Invoice komisi ${inv.code} terbit`,
        body: `Tunggakan Rp${invAmount.toLocaleString("id-ID")} — lunasi sebelum ${suspendAt.toLocaleDateString("id-ID")}.`,
        linkQuery: "v=dashboard&tab=commissions",
        createdAt: issuedAt,
      },
    });
  }

  // ---------- Notifikasi buyer ----------
  await db.notification.createMany({
    data: [
      { userId: buyer.id, type: "order_update", title: "Pembayaran terverifikasi — Kalender Konten IG 30 Hari", body: "Status Lunas. File bisa diunduh dari Koleksi Saya (kuota unduh 1x).", linkQuery: "v=collection", createdAt: daysAgo(2) },
      { userId: buyer.id, type: "order_update", title: "Bukti diterima — Prompt Keyword Riset SEO Bulanan", body: "Bukti transfer kamu sedang diverifikasi AI Receipt Scanner.", linkQuery: "v=orders", createdAt: daysAgo(0, 2) },
      { userId: buyer.id, type: "product_update", title: "Produk yang kamu beli diperbarui: Super Prompt Riset Pasar", body: "File ZIP inti diperbarui ke v1 — sesuai kebijakan, tidak ada re-grant otomatis.", linkQuery: "v=collection", createdAt: daysAgo(1) },
    ],
  });

  // ---------- Report & Dispute ----------
  const reported = await db.product.findUnique({ where: { id: productIds["company-profile-bundle"] } });
  if (reported) {
    await db.report.create({
      data: { productId: reported.id, reporterId: buyer.id, category: "other", detail: "Demo link terasa lambat saat diakses.", status: "open", createdAt: daysAgo(1) },
    });
  }
  const disputedOrder = await db.order.findFirst({
    where: { buyerId: buyer2.id, status: "completed" },
    include: { product: true },
  });
  if (disputedOrder) {
    const dsp = await db.dispute.create({
      data: {
        code: randomCode("DSP"),
        orderId: disputedOrder.id,
        productId: disputedOrder.productId,
        openedByUserId: buyer2.id,
        openedByEmail: "rina@althentic.dev",
        againstStoreId: store1.id,
        title: "Isi prompt tidak sesuai janji deskripsi",
        body: "Bagian walkthrough di dalam ZIP terasa lebih tipis dari contoh di deskripsi produk. Mohon klarifikasi dari seller.",
        category: "content_mismatch",
        status: "investigating",
        createdAt: daysAgo(2),
      },
    });
    await db.disputeEvent.createMany({
      data: [
        { disputeId: dsp.id, actor: "buyer", note: "Dispute dibuka dengan bukti tangkapan layar (dikirim via email).", createdAt: daysAgo(2) },
        { disputeId: dsp.id, actor: "superadmin", note: "Status → Investigating. Seller diminta menunjukkan bukti isi dalam 48 jam (SPEC-16-02).", createdAt: daysAgo(1) },
      ],
    });
  }

  // ---------- Changelog ----------
  await db.changelogEntry.createMany({
    data: [
      { tagName: "v1.4.0", name: "Prompt Generator: drag-and-drop + 3 format ekspor", body: "- Tujuh blok prompt kini bisa diurutkan bebas\n- Ekspor Markdown / plain text / JSON\n- Batas guest 3x/hari/IP\n- Riwayat ekspor tersimpan untuk akun terdaftar", publishedAt: daysAgo(3), url: "https://github.com/althentic/althentic/releases/tag/v1.4.0", source: "github" },
      { tagName: "v1.3.0", name: "AI Receipt Scanner: dukungan provider Gemini + fallback key", body: "- BYOK primary + fallback key\n- Timeout 15 detik, retry otomatis\n- Deteksi bukti duplikat via file hash", publishedAt: daysAgo(10), url: "https://github.com/althentic/althentic/releases/tag/v1.3.0", source: "github" },
      { tagName: "v1.2.0", name: "Koleksi Saya & kuota unduh 1x", body: "- Halaman Koleksi Saya permanen untuk buyer\n- Kuota unduh 1x per order (tanpa reset)\n- Tombol berubah 'Sudah diunduh' otomatis", publishedAt: daysAgo(18), url: "https://github.com/althentic/althentic/releases/tag/v1.2.0", source: "github" },
      { tagName: "v1.1.0", name: "Dashboard Super-Admin: analytics + CSV export", body: "- Metrik GMV, komisi, rasio seller aktif\n- Grafik harian + moving average 7 hari\n- Export CSV per tabel dengan filter aktif", publishedAt: daysAgo(26), url: "https://github.com/althentic/althentic/releases/tag/v1.1.0", source: "github" },
      { tagName: "v1.0.0", name: "Rilis perdana Althentic.Dev", body: "Marketplace prompt serbaguna multi-tenant: katalog, checkout QR lokal, verifikasi AI, komisi threshold, dan dokumentasi lengkap.", publishedAt: daysAgo(35), url: "https://github.com/althentic/althentic/releases/tag/v1.0.0", source: "github" },
    ],
  });

  const counts = {
    users: await db.user.count(),
    stores: await db.store.count(),
    products: await db.product.count(),
    orders: await db.order.count(),
    reviews: await db.review.count(),
    invoices: await db.invoice.count(),
    disputes: await db.dispute.count(),
  };
  console.log("Seed selesai:", counts);
  console.log("Login: admin@althentic.dev / AlthenticAdmin2026! (Super-Admin)");
  console.log("Login: owner@althentic.dev / OwnerToko2026! (Seller pemilik platform)");
  console.log("Login: seller2@althentic.dev / Seller2Toko2026! (Seller + invoice outstanding)");
  console.log("Login: buyer@althentic.dev / BuyerDemo2026! (Buyer demo)");
  console.log("Login: rina@althentic.dev / RinaDemo2026! (Buyer 2)");
}

main()
  .catch((e) => {
    console.error("SEED ERROR", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
