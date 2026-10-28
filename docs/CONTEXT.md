# CONTEXT.md - Konteks Handoff Althentic.Dev

**Tanggal konteks:** 27 Oktober 2026.
**Posisi dokumen:** Dokumen keempat dari tujuh dokumen yang diminta.
**Sumber keputusan:** `althentic-brainstorm-result-final.md`, ekspor 2026-10-27 09:49 WIB; Konteks Terkunci dan 120 Q&A.
**Tambahan eksplisit:** Sembilan kriteria pengguna saat meminta DESIGN.md.
**Tujuan:** Membawa konteks proyek, batas keputusan, status pekerjaan, dan hal yang belum selesai ke percakapan atau pelaksana berikutnya tanpa mengubah hasil brainstorming.

## 1. Aturan menggunakan konteks ini

1. Brainstorming adalah sumber keputusan utama. Dokumen turunannya tidak menggantikan atau melunakkan keputusan tersebut.
2. Instruksi tambahan pengguna yang eksplisit tetap dibawa, termasuk sembilan kriteria desain terbaru pada bagian 4.
3. Kutipan keputusan pada dokumen ini disalin persis dari sumber; pertanyaan asal dipertahankan agar cakupan jawaban tidak hilang. ID `SPEC-xx-yy` menunjukkan section `xx`, pertanyaan ke-`yy` pada brainstorming.
4. CONTEXT.md merupakan pengantar handoff, bukan pengganti seluruh 120 keputusan. Untuk rincian yang tidak dikutip di sini, baca sumber dan SPEC.md sesuai indeks bagian 7.
5. Konflik yang teridentifikasi belum terselesaikan hanya karena pengguna meminta dokumen selanjutnya. Tidak ada izin untuk memilih satu versi secara sepihak.
6. Rincian yang belum diputuskan diberi penanda **[BELUM DIPUTUSKAN - perlu klarifikasi]**; jangan mengisinya dengan asumsi atau best practice yang dianggap sudah disetujui.
7. Lampiran teknis GradientASCII dan gambar isometric hanya menjadi referensi DESIGN.md. Isi teknis/deskripsi aset lampiran tidak disalin atau digunakan untuk menetapkan keputusan baru dalam CONTEXT.md.
8. Bahasa dokumentasi tetap Bahasa Indonesia, jelas dan tidak ambigu.

## 2. Konteks Terkunci

Bagian berikut disalin persis dari brainstorming.

- Althentic.Dev adalah marketplace PROMPT serbaguna dan multi-tenant (setiap seller punya toko dengan slug unik). Seller pertama adalah pemilik platform sendiri. Fokus awal menarik buyer.
- Produk berupa file .zip di Google Drive (link publik, direct download via `uc?export=download&id=`). Preview gambar wajib. Kategori Website punya 3 tipe jual (Template Jadi / Prompt saja / Bundle) dengan harga terpisah. Live demo wajib hanya untuk tipe yang menyertakan template jadi.
- Althentic tidak memegang uang. Seller memasang QR bisnisnya sendiri. Komisi Rp1.000 flat per transaksi terverifikasi, dicatat sebagai “Commission Owed”, dibayar seller secara threshold-based (invoice muncul otomatis saat mencapai threshold, lalu siklus reset ke nol). Bukti transfer komisi diverifikasi manual oleh Super-Admin tanpa AI. Toko bisa di-suspend jika menunggak.
- Verifikasi pembayaran buyer: AI Receipt Scanner dengan BYOK (Gemini dkk). Primary + Fallback key, semi-optional saat onboarding. Kurang bayar ditolak otomatis dan buyer upload bukti susulan. Jika kedua key gagal, muncul tombol WhatsApp ke seller dan produk berstatus “Booked”. Jika seller melewati setup API key, semua order disetujui manual. Bukti yang lolos dikonversi ke .webp sebelum masuk database.
- Verifikasi produk: skrip inspeksi Node.js (cek link Drive, status HTTP live demo, screenshot) menghasilkan laporan Markdown. Super-Admin memverifikasi secara manual ATAU lewat AI via MCP server (Streamable HTTP). Notifikasi email ke Super-Admin lewat Nodemailer.
- Trust & Safety: tombol laporkan produk, rating dan review dari buyer yang sudah membeli, Althentic sebagai mediator.
- Tech stack final: Next.js App Router full-stack di Vercel saja, NeonDB Postgres, Neon + Supabase Storage, Nodemailer.
- Design system: Plus Jakarta Sans, Lucide (tanpa emoji), Lenis smooth scroll, Framer Motion, hero Gradient ASCII (reactbits.dev), Dark/Light/System, navbar desktop auto-hide saat scroll down dan muncul saat scroll up (mobile tidak auto-hide).
- Landing Page (9 section) dan Documentation Page (12 section, gaya GitBook) sudah selesai dibrainstorm.
- Dashboard Super-Admin yang sudah diputuskan: Overview lengkap (metrik ringkas + growth chart + kategori terlaris); single Super-Admin hardcoded; tabel seller (nama toko, slug, jumlah produk, commission owed, status, tanggal join, total transaksi terverifikasi, rating); list verifikasi produk berupa tabel + filter + search + audit trail di tab “Riwayat Verifikasi”; Dispute Resolution berupa inbox sederhana (Open/Investigating/Resolved), komunikasi di luar platform, refund manual di luar sistem.

## 3. Arah produk dan batas fase

### 3.1. Diferensiasi dan indikator keberhasilan

**SPEC-16-11 - Terhadap kompetitor seperti PromptBase, diferensiasi mana yang dipertahankan mati-matian?**

> Lokalisasi penuh: pembayaran QR lokal tanpa kartu internasional, kurasi dan komunitas berbahasa Indonesia, harga Rupiah.

**SPEC-16-15 - Satu metrik utama apa yang menentukan platform dinyatakan berhasil di 6 bulan pertama?**

> Jumlah transaksi terverifikasi per bulan.

Target angka transaksi per bulan dan formula evaluasi keberhasilan enam bulan yang lebih rinci: **[BELUM DIPUTUSKAN - perlu klarifikasi]**. Angka target akuisisi pada pertanyaan brainstorming tidak diubah menjadi SLA atau target transaksi yang belum ditetapkan.

### 3.2. Akuisisi dan monetisasi lanjutan

**SPEC-16-07 - Bagaimana strategi mendapatkan 10 seller pertama (di luar pemilik platform sendiri)?**

> Undangan personal terkurasi: cari 5–10 pembuat prompt yang karyanya sudah bagus di komunitas (X, Discord AI Indonesia), tawarkan onboarding dibantu langsung dan featured listing gratis 30 hari.

**SPEC-16-08 - Bagaimana strategi mendapatkan 100 buyer pertama?**

> Konten dulu: rilis 3–5 prompt gratis berkualitas tinggi dari toko pemilik, dibagikan di komunitas AI dengan CTA menuju marketplace.

**SPEC-16-06 - Selain komisi, monetisasi mana yang paling layak diprioritaskan di fase kedua?**

> Featured listing: produk tampil di posisi teratas katalog/beranda selama 7 hari dengan harga tetap.

**SPEC-12-02 - Apakah Prompt Generator gratis atau berbayar?**

> Gratis penuh di fase awal sebagai alat akuisisi dan demo kualitas prompt; monetisasi nanti lewat template prompt premium di marketplace.

**SPEC-05-04 - Apakah satu akun boleh memiliki lebih dari satu toko?**

> Satu akun = satu toko untuk fase awal; kebutuhan multi-toko ditunda sampai ada seller nyata yang memintanya.

Featured listing tetap memiliki konteks fase kedua. Hubungannya dengan insentif gratis 30 hari bagi seller awal, harga tetapnya, dan alur transaksi prompt gratis: **[BELUM DIPUTUSKAN - perlu klarifikasi]**. Tidak ada penambahan model langganan, kuota berbayar generator, atau multi-toko sebagai keputusan fase awal.

## 4. Sembilan kriteria tambahan yang wajib dibawa

Kriteria berikut berasal dari instruksi pengguna saat meminta DESIGN.md, bukan dari asumsi penulis. Teksnya dipertahankan.

1. Font: Plus Jakarta Sans di seluruh platform.
2. Icon: hanya dari Lucide Icon Library (via CDN). Jangan pernah menggunakan icon emoji, dalam bentuk apa pun.
3. Elemen kustom dengan animasi smooth: custom WebKit scrollbar, custom dropdown, custom checkbox, dan elemen form/UI kustom lainnya - semua dengan transisi/animasi halus, bukan default browser.
4. Accessibility wajib mengikuti standar WCAG di seluruh komponen.
5. Smooth scroll menggunakan Lenis.
6. Responsive design penuh untuk tiga breakpoint: Desktop, Tablet, dan Mobile.
7. Tech stack: Next.js (App Router) sebagai frontend SEKALIGUS backend (API Routes) - satu framework full-stack, bukan React Router terpisah sebagai layer backend. NeonDB Postgres sebagai database, Supabase sebagai storage, Vercel sebagai platform deployment tunggal.
8. Animasi entrance dan exit menggunakan Framer Motion.
9. Gaya visual card (product card, dashboard card, dll) menggunakan Liquid Glass / Glassmorphism style.

### 4.1. Batas detail desain

- Dark/Light/System dan navbar desktop auto-hide saat scroll down/muncul saat scroll up, serta mobile tidak auto-hide, tetap mengikuti Konteks Terkunci.
- Arah warna brand yang disebut pengguna adalah gradasi navy-ke-biru terang + hitam, mengacu pada logo.
- Nilai HEX token brand, spacing scale, radius, dan batas piksel Desktop/Tablet/Mobile belum ditemukan dalam sumber maupun riwayat relevan yang telah diperiksa. Nilainya tidak dianggap dibatalkan, tetapi belum dapat dicantumkan sebagai keputusan terverifikasi: **[BELUM DIPUTUSKAN - perlu klarifikasi]**.
- Versi dan level WCAG, nilai blur/opacity Glassmorphism, durasi/easing animasi, endpoint/versi CDN Lucide, serta pemetaan icon sosial: **[BELUM DIPUTUSKAN - perlu klarifikasi]**.
- Rincian visual dan lampiran teknis tetap dibaca melalui DESIGN.md dalam lingkup desainnya; jangan memindahkan nilai default komponen menjadi token global yang disetujui.
- Dokumen SPEC.md dan ARCHITECTURE.md disusun sebelum sembilan kriteria diperinci. Ketiadaan rincian tambahan di kedua dokumen tersebut tidak membatalkan instruksi terbaru pengguna. Pada tahap ini keduanya belum direvisi untuk memasukkan tambahan tersebut.

## 5. Keputusan operasional yang penting untuk handoff

Kutipan berikut menyoroti keputusan yang mudah berubah secara tidak sengaja saat pembangunan. Seluruh keputusan lain tetap berlaku melalui sumber utama dan SPEC.md.

### 5.1. Akun, toko dan onboarding

**SPEC-05-05 - Bagaimana seorang buyer menjadi seller? Apa mekanisme kenaikan perannya?**

> Semua akun otomatis berperan buyer; menjadi seller dilakukan lewat onboarding khusus (data toko + QR + API key semi-optional) tanpa approval manusia; kontrol kualitas dilakukan di verifikasi produk.

**SPEC-02-01 - Seller ingin mengubah slug tokonya (misal karena rebranding). Aturan apa yang diterapkan?**

> Slug bersifat permanen dan tidak pernah bisa diubah setelah toko dibuat.

**SPEC-05-02 - Verifikasi email: wajib atau tidak, dan di titik apa dipaksa?**

> Wajib verifikasi sebelum checkout pertama, bukan sebelum bisa melihat-lihat katalog; link verifikasi kedaluwarsa dalam 24 jam dan bisa dikirim ulang.

**SPEC-06-01 - Urutan langkah onboarding seller disusun bagaimana?**

> Empat langkah berurutan: (1) profil toko (nama, slug, deskripsi), (2) unggah QR pembayaran, (3) API key AI semi-optional dengan penjelasan konsekuensi, (4) tambah produk pertama dan kirim verifikasi.

**SPEC-06-03 - Bagaimana menyikapi seller yang menekan “Lewati” pada langkah setup API key AI?**

> Lewati diperbolehkan dengan konsekuensi yang ditulis eksplisit di layar (“Semua order harus Anda approve manual”), dan langkah ini bisa diisi belakangan di Settings toko.

**SPEC-06-04 - Kapan tepatnya sebuah toko baru dianggap “live” dan tampil untuk publik?**

> Setelah memiliki minimal 1 produk berstatus terverifikasi (lolos inspeksi); sebelum itu toko berstatus “Disiapkan” yang hanya terlihat oleh pemiliknya.

**SPEC-06-05 - Jika seller berhenti di tengah onboarding (misalnya setelah langkah 2), apa yang terjadi pada datanya?**

> Setiap langkah tersimpan otomatis sebagai draft; dashboard menampilkan checklist “Toko Anda X% siap” dengan tombol langsung ke langkah yang belum selesai.

### 5.2. Pembayaran buyer dan pemeriksaan bukti

**SPEC-07-01 - Aturan pencocokan nominal antara bukti transfer dan harga tipe jual yang dipilih: berapa toleransinya?**

> (Ketik sendiri) nominal di bukti harus persis sama; kurang dari itu ditolak otomatis sebagai kurang bayar, lebih dari itu ditandai untuk review manual dan menghubungi seller untuk melaporkan.

**SPEC-07-02 - Toleransi waktu pada bukti transfer: bagaimana timestamp di bukti dicocokkan dengan sesi order?**

> Bukti harus dibuat dalam jendela sesi order: sejak buyer menekan “Bayar Sekarang” hingga batas kedaluwarsa order; timestamp lebih lama dari itu ditolak.

**SPEC-07-03 - Bagaimana nama pengirim di bukti transfer diperlakukan dalam keputusan verifikasi?**

> Nama pengirim dibaca AI dan ditampilkan sebagai informasi pendukung di UI, tapi bukan syarat lolos-gagal yang keras.

**SPEC-07-04 - Bagaimana sistem mendeteksi bukti transfer yang dipakai ulang untuk order berbeda?**

> Setiap bukti yang lolos disimpan perceptual hash + file hash-nya; bukti baru yang hash-nya cocok dengan riwayat ditolak otomatis dengan alasan “bukti duplikat”.

**SPEC-07-05 - Bagaimana menangani dugaan bukti transfer yang dimanipulasi (nominal diedit di screenshot)?**

> Dua lapis: AI diminta menilai indikasi manipulasi (font tidak konsisten, artefak edit, metadata), dan cross-check logika nominal-format; hasil “curiga” masuk antrian review manual dengan area yang dicurigai ditandai.

**SPEC-07-08 - API key BYOK seller: bagaimana dienkripsi dan divalidasi saat pertama kali disimpan?**

> Dienkripsi at-rest dengan AES-256-GCM memakai key dari environment Vercel, divalidasi dengan satu panggilan test murah saat disimpan, dan hanya pernah ditampilkan ter-mask (mis. AIza...9f2c) setelahnya.

**SPEC-07-09 - Bagaimana mekanisme rotasi (penggantian) API key oleh seller?**

> Seller bisa menekan “Ganti key” kapan saja di Settings toko; key lama langsung nonaktif; jika key gagal 3 kali berturut-turut, sistem mengirim email pengingat untuk rotasi.

**SPEC-07-10 - Saat primary dan fallback key sama-sama gagal (selain tombol WhatsApp ke seller), apa yang sistem lakukan di belakang layar?**

> Order masuk antrian “Perlu Tindakan” di dashboard seller, buyer menerima email berisi instruksi kontak WA beserta ID order, dan status Booked memegang lock produk maksimal 24 jam.

**SPEC-02-06 - Saat seller menyetujui order secara manual (jalur tanpa API key), konfirmasi apa yang wajib dia lakukan sebelum tombol Approve aktif?**

> Checklist 3 item wajib dicentang: nominal terlihat sesuai, nama/nomor pengirim terbaca di bukti, dan waktu transfer masuk akal dengan rentang order.

**SPEC-02-07 - Berapa lama seller boleh tidak merespons order manual sebelum sistem mengambil tindakan otomatis?**

> 24 jam tanpa respons: order otomatis batal, buyer menerima email penjelasan dan boleh reorder, seller menerima peringatan kinerja pertama.

**SPEC-02-10 - Seller mengubah harga sebuah produk; bagaimana dampaknya terhadap order yang sedang berjalan?**

> Harga baru hanya berlaku untuk order yang dibuat setelahnya; order berstatus Menunggu Verifikasi atau Booked tetap mengunci harga lama di baris ordernya.

Kegagalan kedua key, dugaan manipulasi, dan nominal berlebih mempunyai jalur manual yang disebut sumber. Jangan mengubah semua hasil scanner menjadi approve otomatis atau menghilangkan review manual. Kontrak lengkap transisi order dan bukti susulan tetap belum ditentukan.

### 5.3. Komisi dan penagihan

**SPEC-16-05 - Bagaimana nasib komisi Rp1.000 flat ketika ada seller menjual produk super murah, misalnya Rp3.000?**

> Tetap Rp1.000 flat tanpa pengecualian harga.

**SPEC-01-05 - Nominal komisi flat saat ini Rp1.000. Apakah nilai komisi boleh diubah dari halaman Settings, dan bagaimana perilakunya terhadap transaksi lama?**

> Field “Nominal komisi per transaksi” bisa diedit dari Settings, hanya berlaku untuk transaksi baru; setiap baris order menyimpan snapshot nominal komisi saat transaksi terjadi sehingga “Commission Owed” lama tidak berubah sendiri.

**SPEC-09-04 - Berapa nilai threshold invoice komisi (jumlah Commission Owed yang memicu invoice otomatis)?**

> Rp25.000 (setara 25 transaksi terverifikasi), dapat diubah Super-Admin di Settings.

**SPEC-09-05 - Bagaimana transaksi yang dibatalkan atau kedaluwarsa diperlakukan dalam pencatatan komisi?**

> Order batal/kedaluwarsa tidak pernah masuk “Commission Owed”; komisi hanya dicatat saat transaksi terverifikasi, dalam ledger terpisah per event.

**SPEC-09-06 - Ketika Super-Admin memverifikasi bukti pembayaran komisi secara manual, data apa yang dicatat di sistem?**

> Form verifikasi berisi: pilih invoice, nominal diterima, tanggal bayar, metode (transfer/e-wallet), dan referensi opsional; setelah disimpan status invoice menjadi Lunas dan counter reset ke nol.

**SPEC-09-01 - Ketika toko di-suspend karena menunggak komisi, apa persisnya yang terjadi pada produk dan order yang sedang berjalan?**

> Produk disembunyikan dari katalog; order berstatus Lunas tetap bisa mengakses filenya; order Menunggu Verifikasi/Booked diberi tenggat 24 jam untuk diselesaikan manual oleh seller.

Bukti pembayaran buyer dan bukti pembayaran komisi seller adalah konteks berbeda: scanner BYOK untuk buyer, sedangkan pembayaran komisi diverifikasi manual Super-Admin tanpa AI. Waktu suspend dan reset siklus belum selaras; lihat bagian 8.

### 5.4. Verifikasi produk dan batas kewenangan AI

**SPEC-08-01 - Struktur laporan Markdown hasil skrip inspeksi Node.js berisi apa saja?**

> Struktur tetap: status link Drive (OK / 404 / private), status HTTP live demo + screenshot desktop, ukuran file .zip, hash file, dan timestamp inspeksi.

**SPEC-08-02 - Kondisi apa yang memicu reject otomatis tanpa perlu review manusia?**

> Link Drive mati (404 atau private) ATAU live demo merespons HTTP 500 ke atas: langsung direject dengan email alasan ke seller dan tombol “Perbaiki & Kirim Ulang”.

**SPEC-08-04 - MCP server yang dipakai AI untuk verifikasi: bagaimana otorisasi dan keamanannya?**

> Endpoint MCP hanya menerima request dengan secret token dari environment, tidak diekspos publik, dan setiap pemanggilan tercatat di log audit.

**SPEC-08-05 - Seberapa jauh AI (lewat MCP) boleh bertindak dalam keputusan verifikasi produk?**

> AI boleh membaca laporan inspeksi dan data produk, lalu mengusulkan keputusan (approve/reject beserta alasan); eksekusi final tetap menunggu satu klik konfirmasi Super-Admin.

**SPEC-08-06 - Apa saja yang dicatat di audit trail setiap kali verifikasi produk terjadi?**

> Setiap aksi tercatat: aktor (sistem otomatis / Super-Admin / AI), timestamp, payload ringkas (produk, laporan), dan hasil keputusan beserta alasannya.

**SPEC-15-07 - Inspeksi Puppeteer untuk verifikasi produk kena batas serverless Vercel; bagaimana solusinya?**

> Jangan jalankan browser penuh di Vercel: cek status link via fetch HTTP biasa, screenshot via API screenshot free-tier, dan bila perlu browser penuh, jalankan skrip dari mesin lokal Super-Admin lalu unggah laporannya.

Review AI lewat MCP tidak menggantikan klik konfirmasi Super-Admin. Reject teknis otomatis tetap mengikuti kondisi eksplisitnya. Jangan memperluas kondisi reject atau kewenangan AI tanpa keputusan baru pengguna.

### 5.5. Delivery dan kepemilikan buyer

**SPEC-11-03 - Berapa batas jumlah download file per order oleh buyer?**

> Hanya 1 kali download, tanpa kecuali dan tanpa reset.

**SPEC-11-04 - Ketika seller mengupdate isi produk (.zip revisi), bagaimana buyer lama mendapatkan pembaruan?**

> File lama langsung ditimpa tanpa notifikasi ke buyer yang sudah membeli.

**SPEC-11-05 - Jika seller mengganti link Drive sebuah produk (misalnya pindah akun Drive), mekanisme apa yang berjalan?**

> Penggantian link memicu verifikasi ulang singkat (cek link baru hidup dan publik) sebelum produk aktif kembali; hash file dihitung ulang untuk mendeteksi perubahan isi.

**SPEC-11-06 - Di mana buyer melihat bukti kepemilikan atas semua produk yang pernah dia beli (untuk akses ulang jangka panjang)?**

> Halaman “Koleksi Saya” permanen di akun buyer: semua order Lunas dengan tombol download, info versi, dan tanggal beli.

**SPEC-11-01 - Bagaimana platform mendeteksi dan merespons link Google Drive yang mati atau dihapus seller SETELAH produk terjual?**

> Re-inspeksi berkala mingguan untuk semua produk aktif; saat link mati, produk otomatis di-unlist, seller diberi tenggat 72 jam untuk memperbaiki sebelum listing disuspend.

Koleksi permanen tidak memberi hak download tambahan. Batas tetap satu kali tanpa kecuali dan tanpa reset. Kontrak download tanpa redirect versus 302, titik konsumsi kuota, serta unduhan terputus masih perlu klarifikasi.

### 5.6. Trust & Safety

**SPEC-10-01 - Lapisan moderasi apa yang diterapkan pada produk sebelum tampil publik?**

> Dua lapis: verifikasi teknis otomatis (link Drive, live demo) lewat skrip inspeksi, ditambah review singkat Super-Admin atas deskripsi, preview, dan harga untuk menangkap konten ilegal atau menyesatkan.

**SPEC-16-09 - Bagaimana kualitas isi prompt di katalog dijaga (bukan cuma link yang hidup)?**

> Tidak ada penilaian kualitas; semua prompt yang link-nya hidup boleh dijual.

**SPEC-10-04 - Kebijakan refund (yang diproses manual Super-Admin sebagai mediator): kapan buyer dianggap layak didukung?**

> Refund didukung bila: file tidak bisa diakses, isi berbeda drastis dari deskripsi, atau seller tidak merespons 48 jam; “tidak cocok selera” bukan dasar refund.

**SPEC-16-02 - Buyer komplain “isi prompt di dalam .zip tidak sesuai janji” padahal deskripsi terlihat benar. Bagaimana proses klarifikasinya?**

> Seller wajib menunjukkan bukti isi (screenshot terstruktur atau walkthrough singkat) dalam 48 jam lewat dispute; terbukti sesuai: tetap lunas dengan catatan; tidak sesuai: refund manual plus poin sanksi seller.

**SPEC-10-05 - Siapa yang boleh menulis review, dan apa aturan penulisannya?**

> Hanya buyer dengan order Lunas pada produk tersebut, satu review per pembelian, berisi rating + teks, dan boleh diedit sendiri dalam 7 hari pertama.

**SPEC-10-06 - Bisakah seller menghapus review yang merugikan mereka? Bagaimana review yang melanggar aturan ditangani?**

> Seller tidak bisa menghapus review, hanya bisa membalas satu kali secara publik; review yang melanggar (hujatan, doxing, spam) hanya bisa dihapus Super-Admin dengan alasan tercatat.

**SPEC-16-10 - Apa batasan lisensi buyer atas prompt yang dibeli? Bolehkah dijual ulang di Althentic?**

> ToS menyatakan: lisensi penggunaan personal dan komersial atas output, dilarang menjual ulang atau mendistribusikan file prompt mentah; pelanggaran berujung banned.

**SPEC-16-12 - Bagaimana mendeteksi seller yang membeli produknya sendiri (akun kedua) untuk memanipulasi rating dan metrik terlaris?**

> Verifikasi transaksi mencocokkan sinyal: akun buyer dengan IP/device fingerprint yang sama dengan seller ditandai; transaksi self-buy tidak dihitung ke metrik terlaris dan ratingnya diflag untuk review.

Tidak ada penilaian kualitas isi prompt menurut keputusan sumber. Review konten ilegal/menyesatkan juga tercatat; penyelarasan cakupannya belum diputuskan. Komunikasi dispute dan refund tetap di luar platform sesuai Konteks Terkunci.

### 5.7. Prompt Generator

**SPEC-12-01 - Prompt Generator ditujukan untuk siapa di peluncuran pertamanya?**

> Publik tanpa login untuk mencoba, dengan ekspor terbatas; akun terdaftar membuka ekspor penuh dan integrasi marketplace.

**SPEC-12-03 - Komponen (blok) apa saja yang tersedia di canvas pembangun prompt?**

> Tujuh blok inti: Peran (Role), Tugas (Task), Konteks, Format Output, Batasan (Constraints), Contoh (Examples), dan Tone/Gaya.

**SPEC-12-04 - Interaksi drag-drop canvas bagaimana diimplementasikan di versi pertama?**

> Kolom vertikal drag-and-reorder dengan drag handle per blok; urutan blok menentukan urutan struktur prompt akhir.

**SPEC-12-05 - Format ekspor prompt terstruktur yang disediakan?**

> Tiga format: Markdown terstruktur, plain text siap-tempel ke chat AI, dan JSON dengan tiap blok sebagai key.

**SPEC-12-06 - Bagaimana Prompt Generator terintegrasi dengan produk di marketplace?**

> Tombol “Coba di Generator” di halaman detail produk tipe “Prompt saja”; struktur prompt terjual tampil sebagai template read-only di canvas, dengan isi tersembunyi sampai pembelian selesai.

Batas ekspor guest, penyimpanan canvas, pemetaan struktur prompt dari ZIP, serta schema JSON final: **[BELUM DIPUTUSKAN - perlu klarifikasi]**. Kebutuhan generator tidak menetapkan pemanggilan LLM tambahan.

## 6. Batas teknis dan operasional

**SPEC-15-01 - Bagaimana pembagian tugas yang disiplin antara Neon (database) dan Supabase Storage (file)?**

> Neon menyimpan semua data relasional (users, products, orders, ledger komisi, metadata bukti); Supabase Storage hanya menyimpan file biner (bukti .webp, banner, preview) dalam bucket publik dan private terpisah.

**SPEC-15-02 - ORM mana yang dipilih untuk berinteraksi dengan Neon Postgres, dan mengapa?**

> Prisma: schema-first, migration tool matang, type generation kuat, dan dokumentasi melimpah - cocok untuk pengembang solo yang harus cepat jalan dengan aman.

**SPEC-15-03 - Strategi rate limiting di lingkungan serverless Vercel yang tidak punya memori bersama?**

> Rate limit berbasis Upstash Redis REST (free tier) dengan sliding window per-IP+user pada endpoint sensitif: login, upload bukti, dan submit order.

**SPEC-15-04 - Lapisan keamanan wajib di setiap API route adalah apa saja?**

> Validasi input dengan Zod di setiap route, cek session di dalam route (tidak percaya middleware semata), otorisasi per-ownership (buyer hanya menyentuh order miliknya), dan error response yang tidak membocorkan stack.

**SPEC-15-05 - Stack logging dan monitoring minimal yang dipakai di fase awal?**

> Structured logging JSON konsisten dilihat lewat Vercel Logs, plus alert email via Nodemailer untuk error kritis (verifikasi gagal massal, koneksi DB gagal).

**SPEC-15-06 - Strategi backup untuk database Neon seperti apa?**

> Mengandalkan point-in-time restore bawaan Neon, ditambah pg_dump otomatis bulanan via GitHub Actions terjadwal yang disimpan di storage pribadi - dengan uji restore berkala.

**SPEC-16-04 - Platform bergantung pada Google Drive (delivery) dan Gemini (verifikasi). Apa persiapan bila harga atau kebijakan keduanya berubah drastis?**

> Dokumentasikan abstraksi: modul delivery dan modul AI scanner masing-masing punya satu interface tunggal sehingga bisa ganti provider dengan menyentuh 1–2 file saja; digunakan saat benar-benar dibutuhkan.

**SPEC-16-13 - Jika satu-satunya Super-Admin sakit atau tidak bisa mengakses internet selama 2 minggu, apa yang terjadi pada operasi kritis?**

> Terima risiko platform berhenti total selama itu.

**SPEC-16-14 - Data apa yang paling fatal jika bocor, dan sejauh apa rencana respons insidennya?**

> Kandidat paling fatal: API key seller (menyalahgunakan kuota AI atas nama mereka) dan bukti transfer (data finansial); siapkan satu halaman SOP insiden: identifikasi → rotasi key → notifikasi terdampak → post-mortem.

### 6.1. Hal yang tidak boleh diasumsikan sudah dipilih

| Area        | Rincian yang belum ditentukan                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| Auth        | Library auth, bentuk session, identitas hardcoded Super-Admin, account linking dan detail penghapusan akun.  |
| Database    | Schema final, tipe kolom, index, foreign key, transaksi atomik, idempotensi dan konkurensi.                  |
| API         | Daftar endpoint lengkap, payload, kode error dan interface delivery/scanner.                                 |
| AI          | Daftar provider/model, timeout/retry, ambang hash, format hasil scanner dan penyimpanan bukti sebelum lolos. |
| Integrasi   | Provider SMTP/screenshot, scheduler selain backup bulanan, konfigurasi MCP dan realtime.                     |
| Operasional | Region/runtime/version, biaya, SLA/SLO, RPO/RTO, retensi log, jadwal uji restore, SOP insiden rinci.         |

Status seluruh rincian: **[BELUM DIPUTUSKAN - perlu klarifikasi]**. Teknologi yang sudah dipilih tidak menjadi alasan untuk mengarang konfigurasi yang belum ditentukan.

## 7. Peta cakupan sumber lengkap

Tabel ini membantu pelaksana menemukan keputusan yang belum dikutip penuh dalam CONTEXT.md. Semua 120 keputusan tetap berlaku; bagian ini bukan pemangkasan scope.

| Section brainstorming | Cakupan                                                                                                                                                                             | Referensi SPEC.md          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 1                     | Analytics Super-Admin, periode, metrik, chart, CSV, komisi, suspend dan template WA.                                                                                                | SPEC-01-01 s.d. SPEC-01-07 |
| 2                     | Slug, branding/banner/deskripsi toko, order manual, analytics, arsip dan harga.                                                                                                     | SPEC-02-01 s.d. SPEC-02-10 |
| 3                     | Grid, filter URL, sorting, pencarian, pagination, detail, pembelian paralel, rating.                                                                                                | SPEC-03-01 s.d. SPEC-03-08 |
| 4                     | Checkout akun, Booked, WhatsApp, bukti, status/timeline, email dan pembatalan.                                                                                                      | SPEC-04-01 s.d. SPEC-04-08 |
| 5                     | Login, verifikasi/reset, satu toko, role seller, settings dan session.                                                                                                              | SPEC-05-01 s.d. SPEC-05-07 |
| 6                     | Empat langkah onboarding, QR, skip key, toko live, draft dan layar selesai.                                                                                                         | SPEC-06-01 s.d. SPEC-06-06 |
| 7                     | Nominal, waktu, pengirim, duplikat/manipulasi, retensi bukti dan BYOK.                                                                                                              | SPEC-07-01 s.d. SPEC-07-10 |
| 8                     | Inspeksi, reject, perbaikan, MCP, kewenangan AI dan audit.                                                                                                                          | SPEC-08-01 s.d. SPEC-08-06 |
| 9                     | Suspend, grace period, reminder, threshold, ledger dan verifikasi komisi.                                                                                                           | SPEC-09-01 s.d. SPEC-09-06 |
| 10                    | Moderasi, takedown, laporan, refund, review dan sanksi.                                                                                                                             | SPEC-10-01 s.d. SPEC-10-07 |
| 11                    | Link mati, delivery, satu kali unduh, update, ganti link dan koleksi.                                                                                                               | SPEC-11-01 s.d. SPEC-11-06 |
| 12                    | Target/harga generator, tujuh blok, reorder, ekspor dan integrasi marketplace.                                                                                                      | SPEC-12-01 s.d. SPEC-12-06 |
| 13                    | Profil toko, notification center, preferences, error page dan status page.                                                                                                          | SPEC-13-01 s.d. SPEC-13-05 |
| 14                    | Privacy Policy, data transaksi, consent, pajak, usia minimum dan yurisdiksi.                                                                                                        | SPEC-14-01 s.d. SPEC-14-06 |
| 15                    | Data/storage, ORM, rate limit, keamanan route, monitoring, backup dan inspeksi.                                                                                                     | SPEC-15-01 s.d. SPEC-15-07 |
| 16                    | Plagiarisme, dispute isi, konsentrasi seller, abstraksi provider, komisi, fase kedua, akuisisi, kualitas, lisensi, diferensiasi, self-buy, risiko admin, insiden dan metrik sukses. | SPEC-16-01 s.d. SPEC-16-15 |

## 8. Konflik dan hubungan keputusan yang belum diselaraskan

Seluruh baris berstatus **[BELUM DIPUTUSKAN - perlu klarifikasi]**. Tidak ada keputusan pengganti dalam CONTEXT.md.

| ID pada SPEC.md | Keputusan yang tetap dipertahankan                                                                                                                            | Yang belum jelas                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| GAP-01          | Booked sebagai keranjang yang dapat dikeluarkan buyer kapan saja; produk bisa dibeli paralel; kedua key gagal menyebabkan Booked dengan lock maksimal 24 jam. | Makna Booked, objek lock, relasi keranjang/order dan pelepasan lock.                       |
| GAP-02          | Checkout menyebut download tanpa redirect; Delivery File menetapkan `/api/download/[orderId]` lalu 302 ke Drive.                                              | Mekanisme delivery final yang disetujui pengguna.                                          |
| GAP-03          | Suspend ketika batas tunggakan terlewati; grace period tujuh hari dan suspend hari kedelapan setelah invoice.                                                 | Hubungan threshold invoice, batas suspend dan waktu eksekusinya.                           |
| GAP-04          | Scanner menghapus file bukti setelah 30 hari; Privacy Policy menyebut maksimal 90 hari.                                                                       | Penyelarasan retensi operasional dan teks legal; 90 hari tidak otomatis mengganti 30 hari. |
| GAP-05          | File revisi ditimpa tanpa notifikasi; notification center mencakup update produk yang dibeli.                                                                 | Jenis update yang memicu notifikasi.                                                       |
| GAP-06          | Data transaksi hanya dapat diakses Super-Admin; seller mengelola QR dan transaksi, buyer menerima QR/instruksi pembayaran.                                    | Matriks akses per data dan aktor yang dimaksud klausul legal.                              |
| GAP-07          | Review konten ilegal/menyesatkan; semua prompt dengan link hidup boleh dijual tanpa penilaian kualitas.                                                       | Penyelarasan syarat publikasi dan batas moderasi.                                          |
| GAP-08          | Langkah keempat mengirim produk pertama untuk verifikasi; layar selesai meminta pengiriman pertama; toko live setelah produk terverifikasi.                   | Kondisi onboarding selesai, toko siap, Disiapkan dan live.                                 |
| GAP-09          | Konteks menyebut siklus reset setelah threshold/invoice; pembayaran invoice yang diverifikasi mereset counter.                                                | Counter/siklus yang dimaksud dan transaksi baru selama invoice aktif.                      |

### 8.1. Rincian tambahan yang belum tersedia

| Kelompok        | Rujukan gap                  | Hal yang perlu dibawa ke klarifikasi                                                                                                            |
| --------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Isi halaman     | GAP-10                       | Daftar lengkap sembilan section landing dan dua belas section dokumentasi disebut selesai, tetapi rincian brainstormingnya belum disertakan.    |
| Order dan bukti | GAP-11–12                    | Kedaluwarsa sesi normal, transisi status, awal tenggat manual, bukti susulan kurang bayar, penyimpanan sebelum lolos dan kontrak scanner.       |
| Download        | GAP-13                       | Kapan kuota satu kali terpakai, unduhan terputus, akses paralel dan tampilan koleksi setelah kuota habis.                                       |
| Katalog         | GAP-14                       | Kategori lengkap, tipe jual kategori lain, chip harga, filter rating, spesifikasi preview/ZIP, file per tipe, produk serupa dan rumus terlaris. |
| Generator       | GAP-15                       | Ekspor guest, schema JSON, struktur template dan persistensi canvas.                                                                            |
| Komisi          | GAP-16                       | Produk gratis, pembayaran komisi kurang/lebih, refund, unsuspend dan saat snapshot komisi diambil.                                              |
| Akun            | GAP-17                       | Library auth, identitas admin, slug, account linking dan dampak soft-delete.                                                                    |
| Legal           | GAP-18                       | Kota domisili, naskah legal lengkap, makna salinan hasil AI, batas pengajuan dispute dan catatan refund.                                        |
| Teknis          | GAP-19–20                    | Provider, scheduler, signed URL, rate limit, backup, MCP, schema dan kontrak implementasi.                                                      |
| Operasional     | GAP-21                       | Algoritme plagiarisme/fingerprint, formula konsentrasi seller, target numerik, SOP insiden dan nonfungsional.                                   |
| Fase kedua      | GAP-22                       | Harga featured listing dan hubungan fitur fase kedua dengan promosi seller awal.                                                                |
| Desain          | GAP-23; daftar gap DESIGN.md | Token numerik, rincian responsive, WCAG, motion, Glassmorphism dan icon CDN. Kriteria umum sudah diputuskan melalui instruksi terbaru.          |

Status seluruh rincian tabel: **[BELUM DIPUTUSKAN - perlu klarifikasi]**.

### 8.2. Batas interpretasi

1. “120 terjawab” berarti seluruh pertanyaan brainstorming mendapat jawaban; bukan bukti bahwa seluruh kontrak implementasi tersedia atau semua hubungan antarjawaban sudah konsisten.
2. “Belum ditemukan dalam sumber tersedia” tidak berarti keputusan terdahulu boleh dihapus. Minta nilai atau sumber keputusan yang relevan jika diperlukan untuk melanjutkan bagian tersebut.
3. Meminta “lanjut” ke dokumen berikutnya tidak menyelesaikan gap, tidak menetapkan nilai default, dan tidak mengotorisasi perubahan keputusan secara diam-diam.
4. Kriteria desain terbaru menutup kebutuhan umum seperti Glassmorphism dan kontrol kustom; tidak menutup gap nilai numerik atau detail interaksinya.

## 9. Status pekerjaan dan artefak

Status di bawah merekam pekerjaan dalam percakapan ini pada saat CONTEXT.md disusun. “Selesai disusun” tidak berarti setiap gap sudah diselesaikan atau aplikasi sudah dibangun.

| Urutan | File                                   | Fungsi                                                                                                  | Status saat ini                                     |
| ------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Sumber | `althentic-brainstorm-result-final.md` | Konteks Terkunci, 120 Q&A, ringkasan keputusan; lampiran khusus DESIGN.md.                              | Diberikan pengguna dan dibaca.                      |
| 1      | `SPEC.md`                              | Seluruh keputusan sumber, ID referensi dan daftar konflik/gap.                                          | Selesai disusun dan telah diberikan.                |
| 2      | `ARCHITECTURE.md`                      | Batas sistem, data, integrasi, keamanan, operasional, diagram hubungan komponen dan catatan arsitektur. | Selesai disusun dan telah diberikan.                |
| 3      | `DESIGN.md`                            | Sembilan kriteria terbaru, desain eksplisit, dokumentasi lampiran teknis serta gap token/UI.            | Selesai disusun dan telah diberikan.                |
| 4      | `CONTEXT.md`                           | Konteks handoff dan checkpoint keputusan/pekerjaan.                                                     | Dokumen pada langkah ini.                           |
| 5      | `PRD.md`                               | Dokumen kebutuhan produk yang diminta pengguna.                                                         | Belum disusun; menunggu perintah lanjut.            |
| 6      | `PROMPT.md`                            | Prompt handoff untuk chat.z.ai yang akan mengeksekusi pembangunan project.                              | Belum disusun; menunggu urutan dan perintah lanjut. |
| 7      | `WORKFLOW.md`                          | Alur kerja lengkap dalam Mermaid diagram.                                                               | Belum disusun; menunggu urutan dan perintah lanjut. |

Nama file pada tabel adalah nama logis dokumen yang diminta pengguna. Dokumen ini tidak menyatakan repository aplikasi, implementasi frontend/backend, migrasi database, integrasi layanan, pengujian aplikasi, atau deployment telah dikerjakan. Pekerjaan yang telah dilakukan dalam percakapan ini adalah penyusunan dokumentasi.

## 10. Aturan kelanjutan dan handoff

1. Sesudah CONTEXT.md, tunggu instruksi pengguna untuk PRD.md. Jangan menghasilkan PRD.md, PROMPT.md dan WORKFLOW.md sekaligus.
2. Sebelum menyusun bagian terkait, rujuk keputusan asli dan ID SPEC yang relevan; gunakan ARCHITECTURE.md dan DESIGN.md untuk konteks turunannya sesuai cakupan masing-masing.
3. Pertahankan sembilan kriteria tambahan dan seluruh keputusan yang sudah terkunci. Jangan menganggap draft dokumen sebelumnya lebih berwenang daripada instruksi pengguna yang lebih baru.
4. Bedakan keputusan sumber, tambahan eksplisit pengguna, dan gap. Jangan menampilkan pilihan implementasi yang belum disetujui sebagai fakta final.
5. Jika pengguna memberi jawaban klarifikasi, catat keputusan tepatnya dan bagian terdampak. Sampai jawaban tersedia, penanda gap tetap berlaku.
6. Lampiran teknis hanya dipakai untuk DESIGN.md. Jangan mengambil parameter kode atau deskripsi asetnya untuk mengisi dokumen lain.
7. PROMPT.md yang akan datang ditujukan untuk chat.z.ai; file tersebut belum dibuat pada langkah ini. CONTEXT.md tidak menggantikannya dan tidak memulai pembangunan aplikasi.
8. Tidak ada pekerjaan selain CONTEXT.md yang dianggap telah selesai hanya karena dicantumkan dalam daftar kelanjutan.

**Titik lanjut:** menunggu perintah pengguna untuk menyusun **PRD.md**.
