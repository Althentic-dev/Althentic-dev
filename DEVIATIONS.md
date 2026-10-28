# Deviasi dari Spesifikasi

## Lokasi file bukti transfer

- **Keputusan sumber sebelumnya:** `docs/SPEC.md` SPEC-07-06 dan SPEC-15-01 menyebut Supabase Storage untuk bukti transfer.
- **Keputusan yang berlaku:** Bukti WebP privat menggunakan Neon Object Storage bucket `receipts`, dibaca hanya melalui route API yang memverifikasi signed URL.
- **Alasan:** Pemilik produk menetapkan Neon Object Storage sebagai storage bukti receipt. Perubahan provider ini mempertahankan boundary akses private.
- **Cakupan:** Hanya key `receipts/` di bucket `private`; screenshot inspeksi dan objek lain tetap pada adapter filesystem saat ini.
- **Dampak deployment:** Bucket Neon harus dibuat dan disetel private, kredensial S3-compatible harus tersedia, dan pemindahan objek lama tidak dilakukan otomatis.
- **Terkait:** Detail nama env dan status integrasi aset lain tercatat di `TECHNICAL_DECISIONS.md`.
