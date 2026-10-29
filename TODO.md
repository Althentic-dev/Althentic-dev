# TODO Althentic

## Active plans

### PR: Diagnostik aman untuk kegagalan koneksi database production

- [x] Catat nama kelas error dan hanya kode Prisma `Pxxxx` pada log server saat probe database gagal.
- [x] Pastikan log tidak memuat pesan, URL, kredensial, query, atau data pengguna; response API tetap generik.
- [x] Jalankan lint terarah, build, pemeriksaan diff, dan validasi encoding.
- [x] Tautkan Issue 13 ke PR; jangan merge PR.

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

### PR: Integrasi Supabase Storage untuk aset publik

- [x] Arahkan banner dan QR toko ke bucket publik Supabase, serta preview produk ke bucket preview Supabase saat production; pertahankan storage filesystem untuk development.
- [x] Pertahankan receipt `private/receipts/` pada Neon Object Storage dan perilaku URL `/api/files`.
- [x] Ubah probe readiness agar mengecek private bucket Neon dan object sentinel Supabase melalui request read-only berbatas waktu.
- [x] Sediakan script migrasi aset `storage/public` dengan dry-run, tanpa overwrite, serta verifikasi SHA-256 dan akses publik setelah salin.
- [x] Tambahkan environment Supabase yang dibutuhkan ke `.env.example` tanpa nilai rahasia.
- [x] Perbarui dokumentasi arsitektur, setup bucket, migrasi file, dan changelog.
- [x] Jalankan lint terarah dan build, periksa diff dan encoding, serta perbarui graph proyek.
- [x] Setelah PR dibuat, tulis review terkonsolidasi pada `docs/review/CODE_REVIEW.md`.
- [x] Buat Issue dan PR yang terhubung; biarkan PR terbuka untuk ditinjau pemilik.

### PR: Normalisasi em dash pada file proyek

- [x] Ganti seluruh karakter em dash pada file teks tracked dengan tanda hubung biasa, tanpa mengubah makna teks.
- [x] Ganti em dash pada nilai teks database lokal SQLite dengan transaksi; pastikan integritas database dan tidak ada U+2014 tersisa.
- [x] Perbarui changelog dan graph proyek sesuai konvensi repository.
- [x] Jalankan pemeriksaan diff, encoding, dan pemindaian menyeluruh; lint dan build lulus.
- [x] Buat Issue dan PR terkait, tulis review PR pada file CODE_REVIEW di worktree, dan biarkan PR terbuka untuk ditinjau pemilik.

### PR: Perjelas README dan penggunaan logo Althentic

- [x] Pusatkan judul README, tambahkan badge stack yang sesuai repository, dan susun ulang penjelasan fitur, arsitektur storage, setup lokal, migrasi, dan dokumentasi tanpa mengubah instruksi operasional yang masih berlaku.
- [x] Ganti ikon hexagon yang berfungsi sebagai brand mark pada navbar, footer, dan dialog autentikasi dengan `public/logo.svg`; arahkan metadata ikon situs ke file logo yang tersedia.
- [x] Pertahankan ikon fungsional antarmuka dan avatar yang bukan logo; periksa seluruh pemakaian komponen bersama sebelum menyuntingnya.
- [x] Sisipkan catatan changelog tepat di bawah marker entri baru.
- [x] Jalankan lint dan build, lalu periksa diff, encoding UTF-8, dan karakter em dash; perbarui graph proyek setelah perubahan kode.
- [x] Buat Issue dan PR yang terhubung, tulis satu review terkonsolidasi pada `docs/review/CODE_REVIEW.md` di worktree, dan biarkan PR terbuka untuk ditinjau pemilik.

### PR: Jadikan warna CTA katalog solid

- [x] Ganti gradient pada tombol utama “Jelajahi Katalog” di landing page dengan satu warna dari token tema yang sudah tersedia; pertahankan teks, ripple, ukuran, dan interaksi tombol.
- [x] Perbarui changelog di bawah marker terbaru dan tandai rencana ini selesai dalam PR yang sama.
- [x] Perbarui knowledge graph, lalu jalankan lint/build serta pemeriksaan diff, encoding UTF-8, dan karakter em dash.
- [x] Buat Issue dan PR yang terhubung, tulis review terkonsolidasi pada file CODE_REVIEW.md di worktree, dan biarkan PR terbuka untuk ditinjau pemilik.

### PR: Splash screen Particle Text

- [x] Gunakan implementasi Particle Text yang disediakan di `docs/reactbits/text-animations/particle-text.md` sebagai teks “Althentic” berwarna biru pada splash screen.
- [x] Tampilkan splash saat root page dimuat ulang, hilangkan otomatis setelah animasi, hormati reduced motion, dan unmount canvas agar animasi berhenti.
- [x] Muat komponen animasi secara lazy agar source canvas tidak menambah bundle awal aplikasi; jangan tampilkan splash saat navigasi view internal.
- [x] Perbarui changelog dan knowledge graph, lalu jalankan lint/build serta pemeriksaan diff, encoding UTF-8, dan karakter em dash.
- [x] Buat Issue dan PR yang saling ditautkan, tulis satu review terkonsolidasi pada CODE_REVIEW.md di worktree, dan biarkan PR terbuka untuk ditinjau pemilik.

### PR: Hapus teks fallback splash yang duplikat

- [x] Hapus teks fallback statis “Althentic” saat chunk dimuat; teks visual splash hanya berasal dari komponen Particle Text.
- [x] Pertahankan aksesibilitas melalui status pemuatan dan teks screen reader milik Particle Text.
- [x] Perbarui changelog dan graphify, jalankan lint/build, serta periksa diff, UTF-8, dan em dash.
- [x] Pastikan tidak ada isi `docs/reactbits/` yang dilacak atau dimasukkan ke PR; direktori tetap di-ignore oleh `.gitignore` yang sudah ada di `main`.
- [x] Buat Issue dan PR tertaut, catat review PR di worktree, dan jangan merge PR.

### PR: Skeleton loader di seluruh view

- [x] Petakan seluruh dynamic view, status loading data, dan fallback yang sudah ada; pertahankan state error, kosong, dan aksi lokal.
- [x] Ganti fallback teks dynamic import dengan skeleton yang bentuknya sesuai untuk setiap view.
- [x] Selaraskan skeleton data awal, tambahkan status loading aksesibel, dan pisahkan error API agar skeleton tidak tertinggal saat request gagal.
- [x] Cegah tampilan sementara halaman tidak terautentikasi sampai bootstrap sesi selesai.
- [x] Pastikan skeleton responsif, mendukung tema, tidak interaktif, dan menghormati reduced motion.
- [x] Perbarui changelog dan graphify; validasi lint/build, diff, UTF-8, dan em dash.
- [x] Buat Issue dan PR yang saling ditautkan, catat review terkonsolidasi di worktree, dan biarkan PR terbuka untuk pemilik.
- [ ] Buat Issue/PR yang saling ditautkan dan review terkonsolidasi pada file CODE_REVIEW.md di worktree; jangan merge PR.

## Deferred work

- [ ] Audit dinamis penuh hanya dijalankan setelah tersedia runner OS sandbox yang menegakkan batas jaringan, environment, filesystem, dan sumber daya.
- [ ] Tinjau seluruh route API secara sistematis atas batas tenant/role; pemeriksaan pada perubahan ini hanya mencakup route yang disentuh dan jalur kritis yang ditelusuri.
- [ ] Verifikasi konfigurasi deployment dilakukan tanpa membaca atau membagikan nilai secret.
- [ ] Cocokkan batas download 100 MiB dan maxDuration 60 detik dengan ukuran ZIP produk serta limit aktual project Vercel.
- [ ] Selesaikan jalur Prisma untuk Neon/Postgres, termasuk strategi migrasi, generator deployment, dan rollback. Tidak ada migrasi atau perubahan data produksi dalam pekerjaan ini.

## Known Issues

- `docs/SPEC.md` mencatat beberapa keputusan produk yang belum tuntas, termasuk status Booked, retensi bukti, dan akses data transaksi.
- Graphify memiliki simpul terisolasi; graph bukan bukti bahwa semua alur kode telah tercakup.
