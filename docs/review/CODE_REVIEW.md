PR: #28
Repo: Althentic-dev/Althentic-dev
Status: [ ] dicopas

Review PR #28

```md
Pemuatan awal chunk dan data kini memakai skeleton dengan bentuk yang mengikuti view, sedangkan panel seller/admin menampilkan error setelah request gagal alih-alih terus mengumumkan status loading. State kosong dan fallback autentikasi tetap dipisahkan. Pada analitik admin, perubahan rentang membatalkan request sebelumnya dan memulai skeleton baru, sehingga hasil rentang lama tidak tertukar dengan filter aktif.

Satu hal untuk ditinjau sebelum merge: `PageSkeleton` diimpor langsung oleh `AlthenticApp`, yang juga membuat seluruh varian skeleton menjadi bagian dari modul client awal meskipun view kontennya dimuat dinamis. Mohon cek ukuran chunk client awal pada Preview dan pastikan tambahan ini masih sebanding dengan manfaat fallback. Jika kenaikannya material, skeleton dasar tetap perlu tersedia sinkron, tetapi layout variasi dapat diperkecil.

`CHANGELOG.md` menjelaskan perilaku baru termasuk error dashboard. `TODO.md` menandai lingkup sesuai implementasi dan validasi. Tidak ada perubahan schema, storage, atau environment; validasi lint terarah dan build berhasil, sementara typecheck masih melaporkan dua error lama di `src/lib/server/safe-fetch.ts`.
```
