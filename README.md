<div align="center">
  <img src="public/assets/profile/banner.gif" alt="Banner Althentic.Dev" width="100%" />

  <h1>Althentic.Dev</h1>

  <p>Marketplace multi-seller untuk prompt dan produk digital siap pakai.</p>

  <p>
    <a href="https://nextjs.org/"><img alt="Next.js App Router" src="https://img.shields.io/badge/Next.js-App%20Router-000000?logo=next.js" /></a>
    <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-typed-3178C6?logo=typescript&logoColor=white" /></a>
    <a href="https://bun.sh/"><img alt="Bun" src="https://img.shields.io/badge/Runtime-Bun-fbf0df?logo=bun&logoColor=000000" /></a>
    <a href="https://vercel.com/"><img alt="Vercel" src="https://img.shields.io/badge/Hosting-Vercel-000000?logo=vercel" /></a>
  </p>
</div>

Althentic menyediakan toko untuk seller yang menjual prompt, template, dan produk digital lain. Buyer membayar seller secara langsung menggunakan QR milik seller. Althentic mencatat komisi tetap sebagai tagihan seller dan tidak menampung atau membagi dana buyer.

## Fitur utama

- Setiap seller mengelola toko dengan slug unik dan produk digitalnya sendiri.
- Buyer membayar seller secara langsung. Transaksi yang terverifikasi mencatat komisi tetap sebagai **Commission Owed**.
- Bukti transfer dipindai oleh AI Receipt Scanner menggunakan API key milik seller (BYOK). Seller dapat memeriksa transaksi secara manual sebagai fallback.
- Receipt tersimpan privat di Neon Object Storage dan hanya disajikan melalui API yang memeriksa otorisasi.
- Produk dikirim melalui proxy Google Drive agar tautan sumber tidak ditampilkan langsung kepada buyer.

## Teknologi dan penyimpanan

- Next.js App Router, TypeScript, React, dan Tailwind CSS.
- Prisma dengan PostgreSQL Neon. `DATABASE_URL` digunakan untuk koneksi runtime terpool, sedangkan `DIRECT_URL` dipakai command migrasi Prisma.
- Neon Object Storage untuk receipt privat pada bucket `receipts`.
- Supabase Storage untuk banner dan QR toko pada bucket publik, serta preview produk pada bucket publik terpisah.
- Direktori `storage/` digunakan untuk file lokal saat development. Production berjalan di Vercel.

## Menjalankan secara lokal

### Prasyarat

- Bun terpasang.
- Branch database Neon non-production dengan schema yang sudah dimigrasikan.
- Salinan `.env.example` yang sudah dilengkapi untuk environment lokal.

### Setup

1. Pasang dependency yang tercatat pada lockfile:

   ```bash
   bun install --frozen-lockfile
   ```

2. Salin `.env.example` menjadi `.env`, lalu isi konfigurasi development. Gunakan `DATABASE_URL` dari connection pool dan `DIRECT_URL` untuk operasi migrasi. Jangan gunakan kredensial production untuk development.

3. Terapkan migrasi database:

   ```bash
   bun run db:deploy
   ```

4. Jalankan server development:

   ```bash
   bun run dev
   ```

Perintah database lain tersedia di `package.json`. `bun run db:push` hanya untuk perubahan schema development yang dikendalikan; gunakan migration untuk perubahan schema yang akan dirilis.

Receipt memerlukan endpoint Neon Object Storage, kredensial S3-compatible, dan bucket privat `receipts`. Aplikasi tidak memindahkan receipt ke Supabase atau filesystem secara diam-diam ketika storage tersebut belum tersedia.

## Konfigurasi Supabase untuk production

Buat dua bucket Supabase sebelum deployment:

- Bucket `SUPABASE_STORAGE_BUCKET_BANNERS` untuk banner dan gambar QR toko.
- Bucket `SUPABASE_STORAGE_BUCKET_PREVIEWS` untuk preview produk.

Keduanya harus berstatus **Public** agar URL aset dapat dibuka buyer dan pemeriksaan readiness dapat membaca object sentinel. Upload dan penghapusan dilakukan server menggunakan `SUPABASE_SERVICE_ROLE_KEY`; jangan menaruh key tersebut pada variabel `NEXT_PUBLIC_` atau kode browser. Production juga memerlukan `SUPABASE_URL`.

Endpoint `/api/health` memeriksa PostgreSQL, bucket privat receipt Neon, dan object publik Supabase. Endpoint mengembalikan HTTP 200 jika seluruh pemeriksaan siap, atau HTTP 503 jika ada layanan yang belum siap.

## Memindahkan aset dan data lama

Script migrasi aset publik mendukung dry-run. Jalankan dari root repository setelah `.env` disiapkan:

```powershell
bun --env-file=.env scripts/migrate-supabase-public-assets.ts --source .\storage\public
bun --env-file=.env scripts/migrate-supabase-public-assets.ts --source .\storage\public --apply
```

Script memetakan `banners/` dan `qr/` ke bucket banner, serta `products/` ke bucket preview. Script memeriksa object tujuan sebelum upload, menolak penimpaan object dengan hash berbeda, memverifikasi byte hasil upload, dan mempertahankan file sumber. Pastikan file publik berhasil dibuka di production sebelum menghapus sumber lokal.

Untuk impor awal SQLite dan receipt lokal ke Neon, jalankan `bun run db:deploy`, pastikan target adalah branch database yang benar dan tabel aplikasi masih kosong, lalu jalankan:

```bash
bun run scripts/migrate-sqlite-to-neon.ts
```

Utilitas memverifikasi jumlah record dan byte receipt serta tidak menghapus database atau file sumber. Jangan arahkan migrasi lokal ke database production tanpa pemeriksaan target yang disengaja.

## Dokumentasi

- [PRD](docs/PRD.md): tujuan dan kebutuhan produk.
- [SPEC](docs/SPEC.md): alur dan ketentuan fungsional.
- [Architecture](docs/ARCHITECTURE.md): batas sistem dan aliran data.
- [Design](docs/DESIGN.md): aturan antarmuka dan sistem desain.
- [Context](docs/CONTEXT.md): konteks untuk handoff pekerjaan.
- [Workflow](docs/WORKFLOW.md): alur buyer, seller, dan operasional.

## Backup GitHub Actions

Repository ini belum menyediakan workflow backup. Jika workflow `pg_dump` ditambahkan, simpan kredensial database dan storage sebagai GitHub Actions Secrets pada repository atau organization, bukan di `.env` aplikasi. Nama bucket dan region yang tidak rahasia dapat disimpan sebagai Actions Variables atau konfigurasi workflow. Workflow backup belum diimplementasikan oleh aplikasi.

## Lisensi

All rights reserved. Lihat [LICENSE](LICENSE).
