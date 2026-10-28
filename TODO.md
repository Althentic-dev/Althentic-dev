# TODO Althentic

## Active plans

### PR: Diagnostik aman untuk kegagalan koneksi database production

- [x] Catat nama kelas error dan hanya kode Prisma `Pxxxx` pada log server saat probe database gagal.
- [x] Pastikan log tidak memuat pesan, URL, kredensial, query, atau data pengguna; response API tetap generik.
- [x] Jalankan lint terarah, build, pemeriksaan diff, dan validasi encoding.
- [ ] Tautkan Issue 13 ke PR; jangan merge PR.

### PR: Migrasi Neon PostgreSQL dan health readiness

- [x] Ubah Prisma ke PostgreSQL dengan `DATABASE_URL` pooled dan `DIRECT_URL` untuk operasi migration.
- [x] Buat migration awal PostgreSQL dan command deploy yang aman; hilangkan `--accept-data-loss` dari `db:push`.
- [ ] Migrasikan data `db/custom.db` ke Neon hanya setelah preflight target kosong; pertahankan sumber dan verifikasi jumlah record setiap tabel.
- [ ] Salin file receipt WebP lokal ke bucket private Neon tanpa menimpa object yang ada; verifikasi hash dan jumlahnya.
- [x] Tambahkan `GET /api/health` readiness yang merespons 503 saat database atau storage degraded dan 200 saat keduanya operational.
- [x] Perbarui `.env.example`, dokumentasi, dan changelog untuk konfigurasi serta prosedur migrasi.
- [ ] Jalankan lint/build, pemeriksaan diff dan encoding; verifikasi status Vercel Preview.
- [ ] Tautkan Issue 10 dan 11 ke PR; PR tetap terbuka untuk ditinjau pemilik.

### PR: Perbaikan build Turbopack untuk view dinamis

- [x] Ganti objek opsi bersama pada pemanggilan `next/dynamic` dengan object literal yang dapat dianalisis Next.js 16.
- [x] Pertahankan komponen fallback loading yang sama pada seluruh view.
- [x] Perbarui changelog untuk perubahan ini.
- [x] Jalankan lint (lulus), build Next.js (kompilasi lulus), pemeriksaan diff, dan validasi encoding. Perintah gabungan berhenti pada `cp -r` yang tidak didukung shell Windows lokal; Vercel Preview untuk PR lulus.
- [x] Buat Issue dan PR terkait; PR tetap terbuka untuk ditinjau pemilik.

### PR: Hardening pra-deployment dan performa render

- [x] Terapkan secret production fail-closed untuk sesi, file privat, MCP, dan webhook; pertahankan fallback development.
- [x] Batasi fetch inspeksi dan unduhan Google Drive ke HTTP(S) publik dengan DNS pinning, validasi setiap redirect, timeout, dan ukuran respons.
- [x] Jadikan verifikasi order, pembatalan/kedaluwarsa, penerimaan bukti, invoice, komisi, dan konsumsi kuota unduh bersyarat serta atomik; pulihkan kuota bila fetch gagal sebelum stream dimulai.
- [x] Pisahkan pemuatan seluruh view SPA memakai dynamic imports dan fallback aksesibel.
- [x] Perjelas di arsitektur bahwa SQLite masih dipakai schema lokal dan dukungan Neon/Postgres belum siap tanpa schema/migrasi terpisah.
- [x] Batasi JSON body pada webhook, MCP, dan unggahan bukti.
- [x] Perbarui changelog di bawah marker yang benar.
- [x] Jalankan pemeriksaan statis, periksa encoding, diff, dan status Git.
- [x] Buat Issue dan PR terkait; PR tetap terbuka untuk ditinjau pemilik.
- [ ] Jalankan lint/build ketika dependency project tersedia dan side effect toolchain dapat diperiksa.

### PR: Neon Object Storage receipt dan audit environment

- [x] Arahkan unggah, baca, cek, dan hapus bukti private `receipts/` ke Neon Object Storage melalui S3-compatible SDK.
- [x] Gunakan nama env resmi Neon/AWS untuk endpoint, kredensial, dan region serta dokumentasikan setup bucket private.
- [x] Audit `.env.example` dan `.env` lokal; petakan alias terpakai dan hapus konfigurasi yang terbukti tidak dipakai tanpa menampilkan nilai.
- [x] Dokumentasikan gap Supabase untuk banner/preview dan backup Actions; jelaskan Secrets GitHub Actions di README.
- [x] Tampilkan keputusan storage terkini pada arsitektur dan catat deviasi dari SPEC lama.
- [x] Catat perubahan keputusan storage receipt terhadap SPEC sebelumnya di DEVIATIONS.md.
- [x] Buat Issue/PR dan review terkonsolidasi sesuai aturan repository.
- [ ] Jalankan lint/build setelah executable toolchain tersedia; jangan menjalankan test tanpa permintaan.

## Deferred work

- [ ] Audit dinamis penuh hanya dijalankan setelah tersedia runner OS sandbox yang menegakkan batas jaringan, environment, filesystem, dan sumber daya.
- [ ] Tinjau seluruh route API secara sistematis atas batas tenant/role; pemeriksaan pada perubahan ini hanya mencakup route yang disentuh dan jalur kritis yang ditelusuri.
- [ ] Verifikasi konfigurasi deployment dilakukan tanpa membaca atau membagikan nilai secret.
- [ ] Cocokkan batas download 100 MiB dan maxDuration 60 detik dengan ukuran ZIP produk serta limit aktual project Vercel.
- [ ] Selesaikan jalur Prisma untuk Neon/Postgres, termasuk strategi migrasi, generator deployment, dan rollback. Tidak ada migrasi atau perubahan data produksi dalam pekerjaan ini.

## Known Issues

- `docs/SPEC.md` mencatat beberapa keputusan produk yang belum tuntas, termasuk status Booked, retensi bukti, dan akses data transaksi.
- Graphify memiliki simpul terisolasi; graph bukan bukti bahwa semua alur kode telah tercakup.
