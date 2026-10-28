PR: #4
Repo: Althentic-dev/Althentic-dev
Status: [ ] dicopas

Review PR #4

```md
Perubahan source menyatukan beberapa jalur yang sebelumnya berjalan terpisah: `secrets.ts` kini dipakai oleh `auth.ts`, `storage.ts`, dan `mcp.ts`; `safe-fetch.ts` dipakai oleh `inspection.ts` dan `delivery.ts`; transaksi lifecycle ada di `orders.ts` dan `commission.ts`; endpoint `receipt`, `download`, `mcp`, dan `github-release` memakai klaim atau batas payload; `althentic-app.tsx` memuat view secara dinamis. `.env.example` serta `docs/ARCHITECTURE.md` menjelaskan konfigurasi dan batas deployment. `CHANGELOG.md` menyebut limit unduhan, sedangkan `TODO.md` masih mencatat gate yang belum ditutup. Pembagian tersebut sesuai dengan perubahan di PR.

Sebelum PR ini ditandai siap, mohon validasi kompatibilitas transaksi `commission.ts` dan `orders.ts` pada database PostgreSQL yang benar-benar akan dipakai. `prisma/schema.prisma` masih SQLite, dan dokumen arsitektur mengakui belum ada jalur migrasi production. Belum ada hasil lint atau build karena executable `eslint` dan `next` tidak tersedia, serta belum ada pengujian konkurensi.

`safe-fetch.ts` dan `delivery.ts` kini membatasi fetch stream ke 100 MiB dan total 55 detik, sementara route menetapkan `maxDuration` 60 detik. Cocokkan batas itu dengan ukuran ZIP yang telah ada dan limit runtime Vercel aktual. Bila stream gagal sesudah byte dikirim, kuota tetap terpakai; log menandai kegagalan, sehingga pastikan alur dispute/support yang disebut untuk unduhan terputus cukup untuk buyer. Fetch demo oleh provider screenshot pada `inspection.ts` tetap terjadi di luar safe fetch aplikasi.

Dynamic imports di `althentic-app.tsx` berpotensi mengurangi JavaScript awal, tetapi belum ada ukuran bundle atau Core Web Vitals sebelum/sesudah. Tolong ukur hasil tersebut dan audit isolasi tenant/role pada semua API sebelum deployment. Catatan `CHANGELOG.md`, `TODO.md`, dan `docs/ARCHITECTURE.md` sudah menyebut batas database dan validasi yang tertunda; pertahankan penanda ini sampai bukti validasi tersedia.
```
