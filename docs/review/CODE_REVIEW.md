PR: #7
Repo: Althentic-dev/Althentic-dev
Status: [ ] dicopas

Review PR #7

```md
`neon-storage.ts` memakai endpoint, key, region, dan `forcePathStyle` yang sesuai untuk S3-compatible Neon, lalu `storage.ts` merutekan operasi `private/receipts/` ke bucket yang diwajibkan bernama `receipts`. Signature file tetap diverifikasi oleh `/api/files`. Mohon pastikan endpoint production yang diberikan Neon memakai hostname yang lolos validasi `.aws.neon.tech`, dan permission kredensial mencakup operasi upload, read, serta delete. Karena receipt lama tidak dimigrasikan, URL metadata yang masih menunjuk file lokal tidak akan menemukan objek setelah rilis ini; tentukan migrasi atau penanganan data lama sebelum mengaktifkan perubahan pada data existing.

Audit `.env.example`, `TECHNICAL_DECISIONS.md`, README, dan `DEVIATIONS.md` menyebut nama env resmi Neon serta membedakan konfigurasi app dari GitHub Actions. README dan dokumen teknis juga menyatakan bahwa Supabase untuk banner/preview dan workflow backup belum terimplementasi. `.env.example` berisi placeholder dan komentar per variabel; `.env` lokal tidak masuk commit. Dependency `package.json` dan `bun.lock` sama-sama menambahkan AWS SDK.

`ARCHITECTURE.md` menjelaskan receipt berada di Neon, sedangkan catatan SPEC/PRD historis belum diganti; `TECHNICAL_DECISIONS.md` dan `DEVIATIONS.md` menandai keputusan baru yang berlaku. `CHANGELOG.md` menggambarkan perubahan aktual dan `TODO.md` mempertahankan lint/build sebagai belum selesai. Validasi terfokus ESLint dan diff check lulus; lint penuh, build, dan typecheck masih gagal pada error repository yang sudah ada. PR sebaiknya tetap draft sampai blocker tersebut ditinjau serta bucket private dan jalur receipt lama diverifikasi di lingkungan deployment.
```
