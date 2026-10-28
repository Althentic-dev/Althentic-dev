# Changelog

## [Unreleased]
<!-- ENTRI-BARU-SISIPKAN-DI-SINI -->

### Unreleased Update

- Simpan bukti transfer WebP private di Neon Object Storage bucket `receipts` melalui AWS S3 SDK; rapikan env example dan dokumentasi konfigurasi serta backup GitHub Actions.

### Unreleased Update

- Memperketat konfigurasi secret production, validasi jaringan dan ukuran payload termasuk stream unduhan Google Drive yang dibatasi 100 MiB dan 55 detik, serta transisi order dan kuota unduhan agar bersifat atomik.
- Memuat view SPA secara dinamis dan mendokumentasikan status schema SQLite lokal terhadap target database PostgreSQL production.
