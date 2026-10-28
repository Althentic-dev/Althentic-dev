# Changelog

## [Unreleased]
<!-- ENTRI-BARU-SISIPKAN-DI-SINI -->

### Unreleased Update

- Catat nama error dan kode Prisma yang sudah disaring saat probe database production gagal, tanpa memasukkan pesan error atau kredensial ke log.

### Unreleased Update

- Migrasikan database Prisma ke Neon PostgreSQL dengan migration deploy yang aman, sediakan utilitas impor data SQLite dan receipt lama tanpa menghapus sumber, serta sediakan `/api/health` yang memakai status readiness HTTP 200/503. Build standalone kini menyalin aset lewat Node.js agar kompatibel dengan Windows dan Linux.

### Unreleased Update

- Perbaiki opsi `next/dynamic` agar setiap view dapat dikompilasi oleh Turbopack di Next.js 16.

### Unreleased Update

- Simpan bukti transfer WebP private di Neon Object Storage bucket `receipts` melalui AWS S3 SDK; rapikan env example dan dokumentasi konfigurasi serta backup GitHub Actions.

### Unreleased Update

- Memperketat konfigurasi secret production, validasi jaringan dan ukuran payload termasuk stream unduhan Google Drive yang dibatasi 100 MiB dan 55 detik, serta transisi order dan kuota unduhan agar bersifat atomik.
- Memuat view SPA secara dinamis dan mendokumentasikan status schema SQLite lokal terhadap target database PostgreSQL production.
