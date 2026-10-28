PR: #12
Repo: Althentic-dev/Althentic-dev
Status: [ ] dicopas

Review PR #12

```md
Perubahan schema, migration SQL, perintah database, dan importer sudah searah untuk PostgreSQL Neon. Sebelum menjalankan importer, pastikan `DATABASE_URL` dan `DIRECT_URL` menunjuk branch Neon yang sama; importer memeriksa tabel aplikasi kosong tetapi pemeriksaan itu tidak melindungi dari proses lain yang menulis setelah preflight. File receipt diunggah sebelum transaksi record, sehingga kegagalan transaksi dapat meninggalkan object yatim, walaupun percobaan ulang akan memakai ulang object yang byte-nya sama. `/api/health` memakai pemeriksaan storage publik dari `/api/status`; karena banner dan preview masih memakai filesystem lokal, endpoint akan tetap 503 di Vercel sampai storage publik dapat dijangkau. Migration dan impor produksi belum tervalidasi karena koneksi Neon gagal P1001, jadi jalankan dan verifikasi langkah tersebut sebelum menganggap migrasi selesai. Dokumentasi `TODO.md`, `README.md`, `TECHNICAL_DECISIONS.md`, `DEVIATIONS.md`, `docs/ARCHITECTURE.md`, `CHANGELOG.md`, dan `.env.example` sudah menjelaskan pemisahan URL, batas impor, sumber lokal, dan langkah deployment; pastikan catatan bahwa import belum dilakukan tetap sesuai setelah operasional berhasil.
```
