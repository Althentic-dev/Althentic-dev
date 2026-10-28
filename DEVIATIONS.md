# Deviasi dari Spesifikasi

## Provider database SQLite ke Neon PostgreSQL

- **Implementasi sebelumnya:** Schema Prisma memakai SQLite, sedangkan database production sudah diarahkan ke Neon PostgreSQL. Perbedaan ini membuat Prisma menolak URL PostgreSQL dengan error P1012 karena provider SQLite hanya menerima URL `file:`.
- **Keputusan yang berlaku:** Prisma memakai PostgreSQL. Runtime menggunakan `DATABASE_URL` pooled, sedangkan migration menggunakan `DIRECT_URL` pada Prisma 6.
- **Migrasi data:** Utilitas untuk memindahkan relasi dari `db/custom.db` dan file bukti WebP yang tertaut ke Neon tersedia, tetapi import aktual belum dilakukan karena host Neon tidak dapat dijangkau dari environment ini. Sumber tidak dihapus. Target harus kosong sebelum import; jumlah record dan byte receipt diverifikasi.
- **Operasional:** Schema berubah melalui file migration dan production memakai `bun run db:deploy`. `db:push` tidak lagi menerima `--accept-data-loss` secara otomatis.

## Lokasi file bukti transfer

- **Keputusan sumber sebelumnya:** `docs/SPEC.md` SPEC-07-06 dan SPEC-15-01 menyebut Supabase Storage untuk bukti transfer.
- **Keputusan yang berlaku:** Bukti WebP privat menggunakan Neon Object Storage bucket `receipts`, dibaca hanya melalui route API yang memverifikasi signed URL.
- **Alasan:** Pemilik produk menetapkan Neon Object Storage sebagai storage bukti receipt. Perubahan provider ini mempertahankan boundary akses private.
- **Cakupan:** Hanya key `receipts/` di bucket `private`; screenshot inspeksi dan objek lain tetap pada adapter filesystem saat ini.
- **Dampak deployment:** Bucket Neon harus dibuat dan disetel private, kredensial S3-compatible harus tersedia, dan file receipt lama perlu dipindahkan satu kali memakai utilitas migrasi sebelum data SQLite sumber dipensiunkan.
- **Terkait:** Detail nama env dan status integrasi aset lain tercatat di `TECHNICAL_DECISIONS.md`.
