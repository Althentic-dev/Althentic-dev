PR: #16
Repo: Althentic-dev/Althentic-dev
Status: [ ] dicopas

Review PR #16

```md
Adapter memetakan `banners/` dan `qr/` ke bucket banner serta `products/` ke bucket preview. Validasi prefix, HTTPS, timeout, dan penggunaan service role di server menjaga jalur publik/private tetap terpisah. Receipt tetap memakai Neon; readiness memeriksa bucket Neon tanpa menulis data dan object publik Supabase tanpa mengambil bytes.

Script migrasi melakukan preflight untuk seluruh target sebelum upload, menolak hash yang berbeda, memakai `upsert: false`, lalu memeriksa hash dan akses publik. Catatan hasil 36 file sesuai dengan verifikasi yang dijalankan. Route upload kini meneruskan kegagalan storage sebagai error provider, terpisah dari validasi gambar.

Pertanyaan deployment: adapter memakai `NODE_ENV === "production"`. Jika Vercel Preview dipakai untuk menguji upload, pastikan environment Preview juga mendapat konfigurasi Supabase yang sesuai. Pertimbangkan project atau bucket Preview terpisah agar pengujian tidak menulis ke aset Production.

`package.json` dan `bun.lock` menambahkan versi SDK yang sama; `.env.example` hanya mencantumkan nama konfigurasi tanpa nilai rahasia. README, `TECHNICAL_DECISIONS.md`, dan `docs/ARCHITECTURE.md` menjelaskan pemetaan bucket, secret server-side, dan migrasi sumber. Changelog mencatat perubahan readiness kedua storage. `TODO.md` mencatat implementasi, validasi, Issue, dan PR; status review tetap `[ ] dicopas` untuk menunggu tindakan pemilik.
```
