# PRD.md — Product Requirements Document Althentic.Dev

**Tanggal penyusunan:** 27 Oktober 2026.
**Sumber keputusan utama:** `althentic-brainstorm-result-final.md`, ekspor 2026-10-27 09:49 WIB; Konteks Terkunci dan 120 Q&A.
**Tambahan eksplisit:** Sembilan kriteria wajib pengguna pada permintaan DESIGN.md.
**Status:** Kebutuhan produk terdokumentasi; konflik dan rincian yang belum diputuskan tetap terbuka. Dokumen ini bukan pernyataan bahwa implementasi telah selesai atau produk telah lulus pengujian.

## 1. Tujuan dan aturan PRD

PRD ini menghubungkan arah produk, pengguna, cakupan, kebutuhan fungsional/nonfungsional, dan pemeriksaan penerimaan dengan keputusan yang telah diberikan. Tidak ada keputusan produk, bisnis, atau teknis baru yang ditambahkan untuk mengisi kekosongan sumber.

1. Blok **Keputusan** dalam bagian kebutuhan mempertahankan jawaban brainstorming persis, termasuk penanda “(Ketik sendiri)”. Pertanyaan asal disertakan untuk menjaga konteks.
2. ID `PRD-xx-yy` memetakan langsung ke `SPEC-xx-yy`: section `xx`, pertanyaan ke-`yy` pada brainstorming. ID tersebut hanya penanda dokumentasi.
3. Kriteria penerimaan merupakan cara memeriksa keputusan sumber, bukan penambahan fitur, target angka, ataupun pilihan implementasi.
4. Jawaban yang belum selaras dicatat bersama. PRD tidak menetapkan prioritas antarjawaban untuk menyelesaikan konflik secara sepihak.
5. Rincian yang belum tersedia diberi tanda **[BELUM DIPUTUSKAN — perlu klarifikasi]**.
6. Lampiran GradientASCII dan isometric block cluster hanya menjadi referensi DESIGN.md; keduanya tidak digunakan untuk menurunkan kebutuhan baru dalam PRD ini.
7. Bagian strategi/fase kedua tetap mengikuti konteks fasenya. Pencantumannya dalam daftar kebutuhan tidak otomatis menjadikannya fitur peluncuran awal.

## 2. Ringkasan produk dan arah bisnis

### 2.1. Identitas produk

Althentic.Dev adalah marketplace prompt serbaguna dan multi-tenant. Setiap seller memiliki toko dengan slug unik; seller pertama adalah pemilik platform sendiri. Fokus awal adalah menarik buyer. Produk disampaikan dalam file ZIP melalui Google Drive dengan preview gambar wajib, serta live demo wajib untuk tipe yang menyertakan template jadi.

Althentic tidak memegang uang transaksi buyer. Seller menggunakan QR bisnisnya sendiri; platform mencatat komisi atas transaksi terverifikasi dan menagihnya kepada seller sesuai aturan threshold.

Pernyataan ini mengikuti Konteks Terkunci pada bagian 3. Riset masalah pengguna, estimasi ukuran pasar, persona demografis, dan validasi permintaan tidak tersedia dalam sumber: **[BELUM DIPUTUSKAN — perlu klarifikasi]**. PRD tidak mengarang hasil riset tersebut.

### 2.2. Diferensiasi dan ukuran keberhasilan

**Keputusan sumber — SPEC-16-11:**

> Lokalisasi penuh: pembayaran QR lokal tanpa kartu internasional, kurasi dan komunitas berbahasa Indonesia, harga Rupiah.

**Keputusan sumber — SPEC-16-15; metrik utama enam bulan pertama:**

> Jumlah transaksi terverifikasi per bulan.

Target numerik, baseline, rumus periode bulanan, dan nilai ambang keberhasilan: **[BELUM DIPUTUSKAN — perlu klarifikasi]**. GMV, komisi, rasio seller aktif/suspend, produk terlaris dan konsentrasi top-1 seller tetap merupakan metrik yang tercatat, tetapi tidak menggantikan metrik utama tersebut.

### 2.3. Akuisisi dan fase lanjutan

| Area             | Keputusan sumber yang dirujuk                                                                                | Konteks fase                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Seller pertama   | Pemilik platform sendiri.                                                                                    | Konteks Terkunci.                                   |
| Rekrutmen seller | Undangan personal terkurasi kepada 5–10 pembuat prompt, onboarding dibantu, featured listing gratis 30 hari. | Strategi mendapatkan 10 seller pertama; SPEC-16-07. |
| Akuisisi buyer   | Rilis 3–5 prompt gratis dari toko pemilik dan bagikan ke komunitas AI dengan CTA marketplace.                | Strategi mendapatkan 100 buyer pertama; SPEC-16-08. |
| Generator        | Gratis penuh sebagai alat akuisisi dan demo; monetisasi nanti melalui template premium.                      | Fase awal dan arah berikutnya; SPEC-12-02.          |
| Featured listing | Posisi teratas katalog/beranda selama 7 hari, harga tetap.                                                   | Monetisasi fase kedua; SPEC-16-06.                  |
| Multi-toko       | Satu akun satu toko; multi-toko ditunda sampai ada seller nyata yang meminta.                                | Batas fase awal; SPEC-05-04.                        |

Teks keputusan lengkap ada pada bagian 6. Harga featured listing, hubungan promosi gratis 30 hari dengan fase kedua, alur prompt gratis, target tanggal rilis, dan prioritas implementasi antarfitur: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.

## 3. Konteks Terkunci

Disalin persis dari sumber.

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

## 4. Pengguna, peran dan kebutuhan yang dilayani

Tabel ini mengelompokkan penggunaan yang sudah tercatat; tidak menambahkan persona atau role baru pada model akun.

| Pengguna/pelaksana           | Kebutuhan dan tindakan dari sumber                                                                                                                      | Rujukan                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Pengunjung                   | Melihat katalog; mencoba Prompt Generator tanpa login dengan ekspor terbatas.                                                                           | SPEC-05-02; SPEC-12-01                              |
| Buyer                        | Membuat akun, verifikasi email, memilih produk/tipe jual, membayar ke QR seller, mengirim bukti, melihat status, mengakses koleksi, review dan dispute. | Section 3–5, 10–12                                  |
| Seller                       | Onboarding toko, QR dan BYOK semi-optional; produk/verifikasi, order manual, analytics dan kewajiban komisi.                                            | Section 2, 6–9                                      |
| Single Super-Admin hardcoded | Overview, analytics, seller, verifikasi produk, verifikasi komisi manual, moderasi dan mediasi dispute.                                                 | Konteks Terkunci; section 1, 8–10                   |
| AI melalui MCP               | Membaca laporan inspeksi/data produk dan mengusulkan keputusan; final menunggu konfirmasi Super-Admin.                                                  | SPEC-08-05; pelaksana bantuan, bukan role akun baru |

### 4.1. Perjalanan pengguna yang menjadi cakupan produk

| Perjalanan                  | Bagian yang sudah ditentukan                                                               | Batas informasi                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Menemukan produk            | Katalog dengan filter URL, pencarian, sorting, pagination dan detail.                      | Nilai chip harga, kategori lengkap dan rumus terlaris belum dirinci.                |
| Membeli produk              | Akun sebelum checkout, verifikasi email pertama, QR seller, bukti dan status order.        | State machine final, makna Booked dan kedaluwarsa sesi biasa belum selaras/lengkap. |
| Menerima file               | Lunas membuka file, koleksi permanen, satu kali download.                                  | Delivery tanpa redirect vs 302 dan titik konsumsi kuota belum diputuskan.           |
| Menjadi seller              | Empat langkah onboarding, draft tersimpan, live setelah minimal satu produk terverifikasi. | Hubungan layar selesai dengan pengiriman verifikasi pertama perlu diselaraskan.     |
| Menjual dan membayar komisi | Order terverifikasi mencatat ledger; invoice threshold; pembayaran komisi manual.          | Waktu suspend, reset siklus dan transaksi selama invoice aktif belum selaras.       |
| Menangani masalah           | Laporan, review, dispute, mediasi dan refund di luar sistem.                               | Batas akses data transaksi dan detail refund masih perlu klarifikasi.               |
| Membangun prompt            | Tujuh blok, drag-and-reorder vertikal, tiga format ekspor, template produk.                | Batas guest, persistensi dan struktur template belum ditentukan.                    |

Tabel bukan state machine baru. Cabang yang belum diputuskan tidak dihubungkan menjadi alur seolah-olah telah disetujui.

## 5. Cakupan dan batas produk

### 5.1. Cakupan yang tercatat

1. Halaman publik: landing, dokumentasi, katalog/detail, profil toko, Prompt Generator, status dan halaman error.
2. Buyer: auth, akun/settings, checkout, pembayaran dan verifikasi bukti, status order, koleksi, review, laporan/dispute dan notifikasi.
3. Seller: onboarding, branding toko, produk, order, verifikasi manual, BYOK, analytics, komisi/tagihan dan settings.
4. Super-Admin: Overview, Analytics Platform, seller, verifikasi produk beserta audit trail, komisi/invoice, settings, takedown/review dan dispute inbox.
5. Operasional: inspeksi dan re-inspeksi, notifikasi email, ledger, reminder, retensi, keamanan route, backup/logging dan respons insiden sesuai sumber.

### 5.2. Batas yang sudah diputuskan

| Batas                         | Keputusan sumber                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Penanganan dana               | Althentic tidak memegang uang; QR bisnis seller sendiri.                                                           |
| Pembayaran komisi             | Verifikasi manual Super-Admin tanpa AI.                                                                            |
| Checkout guest                | Tidak tersedia; wajib akun sebelum checkout.                                                                       |
| Jumlah toko                   | Satu akun satu toko pada fase awal.                                                                                |
| Slug                          | Permanen dan tidak dapat diubah setelah toko dibuat.                                                               |
| Download                      | Hanya satu kali, tanpa kecuali dan tanpa reset.                                                                    |
| Review                        | Buyer dengan order Lunas; seller tidak dapat menghapus review.                                                     |
| Refund dan komunikasi dispute | Manual/di luar sistem, platform sebagai mediator.                                                                  |
| AI verifikasi produk          | Mengusulkan keputusan; konfirmasi final oleh Super-Admin.                                                          |
| Penilaian kualitas isi prompt | Tidak ada penilaian kualitas menurut SPEC-16-09; hubungan dengan moderasi teknis/konten tetap dicatat sebagai gap. |
| Browser penuh untuk inspeksi  | Tidak dijalankan di Vercel; penggunaan lokal bila perlu sudah disebut sumber.                                      |
| Ketiadaan Super-Admin         | Risiko platform berhenti total diterima.                                                                           |

Tidak ditambahkan pemotongan scope MVP, prioritas P0/P1, target sprint, payment gateway, subscription, atau SLA sebagai keputusan baru.

## 6. Kebutuhan produk terperinci

Seluruh 120 jawaban dipertahankan pada bagian ini agar kebutuhan tidak terpotong. Urutan kelompok mengikuti sumber dan bukan urutan pembangunan. Aturan pada bagian 3 dan sembilan kriteria tambahan pada bagian 7 tetap berlaku di luar 120 jawaban tersebut.

### 6.1. Dashboard Super-Admin — Analytics Platform & Settings

#### PRD-01-01 — Periode default Analytics

**Referensi:** SPEC-01-01.

**Konteks keputusan:** Rentang waktu default apa yang ditampilkan saat Super-Admin pertama kali membuka halaman Analytics Platform?

**Keputusan:** “7 hari terakhir” sebagai periode default, dengan tab cepat: Hari ini / 7 hari / 30 hari / 90 hari / Custom.

#### PRD-01-02 — Metrik 4 kartu Analytics

**Referensi:** SPEC-01-02.

**Konteks keputusan:** Empat kartu metrik teratas Analytics Platform (di luar Overview yang sudah ada) harus menampilkan apa?

**Keputusan:** GMV estimasi (nilai transaksi terverifikasi), jumlah transaksi terverifikasi, komisi tertagih vs outstanding, dan rasio seller aktif vs suspend — satu layar langsung menjawab “sehat atau tidaknya marketplace”.

#### PRD-01-03 — Grafik saat data harian kecil

**Referensi:** SPEC-01-03.

**Konteks keputusan:** Bagaimana grafik tren transaksi ditampilkan ketika jumlah transaksi harian masih sangat kecil (0–3 transaksi per hari)?

**Keputusan:** Line chart harian tetap ditampilkan, ditambah garis kedua berupa moving average 7 hari sebagai baseline tren.

#### PRD-01-04 — Ekspor data Analytics

**Referensi:** SPEC-01-04.

**Konteks keputusan:** Fitur ekspor data dari Analytics Platform: format apa yang dipakai dan cakupannya bagaimana?

**Keputusan:** Export CSV per-tabel (transaksi, komisi, seller) dengan semua filter aktif diterapkan ke file yang diunduh.

#### PRD-01-05 — Komisi bisa diubah di Settings

**Referensi:** SPEC-01-05.

**Konteks keputusan:** Nominal komisi flat saat ini Rp1.000. Apakah nilai komisi boleh diubah dari halaman Settings, dan bagaimana perilakunya terhadap transaksi lama?

**Keputusan:** Field “Nominal komisi per transaksi” bisa diedit dari Settings, hanya berlaku untuk transaksi baru; setiap baris order menyimpan snapshot nominal komisi saat transaksi terjadi sehingga “Commission Owed” lama tidak berubah sendiri.

#### PRD-01-06 — Threshold suspend menunggak

**Referensi:** SPEC-01-06.

**Konteks keputusan:** Threshold suspend untuk seller menunggak komisi: berapa nilainya dan perilakunya seperti apa?

**Keputusan:** Setting “Batas tunggakan sebelum suspend” default Rp25.000 (setara 25 transaksi); saat terlewati toko di-suspend otomatis, dengan email peringatan otomatis saat saldo menyentuh 50% dan 80% dari batas.

#### PRD-01-07 — Template WhatsApp fallback

**Referensi:** SPEC-01-07.

**Konteks keputusan:** Template pesan WhatsApp fallback (yang muncul saat AI Receipt Scanner gagal total) dikelola bagaimana di Settings?

**Keputusan:** Textarea template di Settings dengan placeholder {nama_buyer}, {nama_produk}, {jumlah}, {slug_toko}, plus tombol “Uji pratinjau” yang merender contoh pesan.

### 6.2. Dashboard Admin/Seller

#### PRD-02-01 — Aturan ubah slug toko

**Referensi:** SPEC-02-01.

**Konteks keputusan:** Seller ingin mengubah slug tokonya (misal karena rebranding). Aturan apa yang diterapkan?

**Keputusan:** Slug bersifat permanen dan tidak pernah bisa diubah setelah toko dibuat.

#### PRD-02-02 — Warna aksen branding toko

**Referensi:** SPEC-02-02.

**Konteks keputusan:** Untuk branding toko, seberapa jauh seller boleh mengkustomisasi warna halaman tokonya?

**Keputusan:** Seller memilih 1 warna aksen dari 8 preset terkurasi yang hanya diterapkan pada banner, badge, dan tombol CTA tokonya — tidak menyentuh kerangka UI platform.

#### PRD-02-03 — Spesifikasi banner toko

**Referensi:** SPEC-02-03.

**Konteks keputusan:** Spesifikasi upload banner toko seperti apa yang diterapkan?

**Keputusan:** Satu banner 1600x400 px (rasio 4:1), JPG/PNG maksimal 2 MB, dikonversi otomatis ke .webp, dengan preview tampilan desktop dan mobile sebelum disimpan.

#### PRD-02-04 — Batas & struktur deskripsi toko

**Referensi:** SPEC-02-04.

**Konteks keputusan:** Deskripsi toko: batas panjang dan strukturnya bagaimana?

**Keputusan:** Deskripsi maksimal 500 karakter plain-text, ditambah field terpisah untuk maksimal 3 link sosial media (Instagram, X, TikTok) yang dirender sebagai ikon resmi.

#### PRD-02-05 — Filter default daftar order

**Referensi:** SPEC-02-05.

**Konteks keputusan:** Daftar order di dashboard seller: kolom, urutan, dan filter default apa yang dipakai?

**Keputusan:** Tabel dengan kolom ID order, produk, harga, status (Menunggu Verifikasi / Booked / Lunas / Dibatalkan / Kedaluwarsa), waktu relatif (“2 jam lalu”); filter default “Menunggu Verifikasi + Booked” agar aksi menunggu selalu di atas.

#### PRD-02-06 — Checklist approve manual

**Referensi:** SPEC-02-06.

**Konteks keputusan:** Saat seller menyetujui order secara manual (jalur tanpa API key), konfirmasi apa yang wajib dia lakukan sebelum tombol Approve aktif?

**Keputusan:** Checklist 3 item wajib dicentang: nominal terlihat sesuai, nama/nomor pengirim terbaca di bukti, dan waktu transfer masuk akal dengan rentang order.

#### PRD-02-07 — Batas respons order manual

**Referensi:** SPEC-02-07.

**Konteks keputusan:** Berapa lama seller boleh tidak merespons order manual sebelum sistem mengambil tindakan otomatis?

**Keputusan:** 24 jam tanpa respons: order otomatis batal, buyer menerima email penjelasan dan boleh reorder, seller menerima peringatan kinerja pertama.

#### PRD-02-08 — Metrik utama analytics toko

**Referensi:** SPEC-02-08.

**Konteks keputusan:** Analytics penjualan toko: metrik utama apa yang ditampilkan di halaman tersebut?

**Keputusan:** Empat kartu: transaksi terverifikasi, revenue kotor, Commission Owed berjalan, dan produk terlaris — dilengkapi grafik 30 hari dan tabel 5 produk teratas.

#### PRD-02-09 — Perilaku arsip produk

**Referensi:** SPEC-02-09.

**Konteks keputusan:** Ketika seller mengarsipkan (archive) sebuah produk, apa persisnya yang terjadi?

**Keputusan:** Produk hilang dari katalog dan pencarian, order dan statistik lama tetap tersedia di dashboard, dan produk bisa di-unarchive kapan saja ke status draft.

#### PRD-02-10 — Ubah harga vs order berjalan

**Referensi:** SPEC-02-10.

**Konteks keputusan:** Seller mengubah harga sebuah produk; bagaimana dampaknya terhadap order yang sedang berjalan?

**Keputusan:** Harga baru hanya berlaku untuk order yang dibuat setelahnya; order berstatus Menunggu Verifikasi atau Booked tetap mengunci harga lama di baris ordernya.

### 6.3. Katalog & Detail Produk

#### PRD-03-01 — Struktur listing katalog

**Referensi:** SPEC-03-01.

**Konteks keputusan:** Struktur listing katalog utama untuk menampilkan semua produk seperti apa?

**Keputusan:** Grid kartu 3 kolom di desktop (2 tablet, 1 mobile): preview gambar, judul, harga termurah dari tipe jual yang tersedia, badge kategori, rating, dan nama toko.

#### PRD-03-02 — Set & perilaku filter

**Referensi:** SPEC-03-02.

**Konteks keputusan:** Set filter katalog: filter apa saja yang ada dan bagaimana perilakunya?

**Keputusan:** Filter Kategori, Tipe Jual (Template Jadi / Prompt saja / Bundle), Rentang Harga (chip preset), dan Rating Minimum — semuanya tersimpan sebagai URL query sehingga hasil filter bisa di-share dan tombol back browser berfungsi.

#### PRD-03-03 — Sort default katalog

**Referensi:** SPEC-03-03.

**Konteks keputusan:** Sorting default katalog dan daftar pilihan sort yang ditawarkan?

**Keputusan:** Default “Terlaris minggu ini”, dengan opsi: Terbaru, Termurah, Termahal, Rating tertinggi.

#### PRD-03-04 — Perilaku pencarian

**Referensi:** SPEC-03-04.

**Konteks keputusan:** Perilaku minimum kotak pencarian di katalog seperti apa?

**Keputusan:** Mencari di judul produk, deskripsi, dan nama toko; debounce 300ms; state “tidak ada hasil” menampilkan 3 chip kategori populer sebagai saran.

#### PRD-03-05 — Pagination vs infinite scroll

**Referensi:** SPEC-03-05.

**Konteks keputusan:** Pagination atau infinite scroll untuk navigasi katalog?

**Keputusan:** Pagination klasik 24 produk per halaman dengan nomor halaman dan URL yang ikut berganti.

#### PRD-03-06 — Urutan blok halaman detail

**Referensi:** SPEC-03-06.

**Konteks keputusan:** Urutan blok konten di halaman detail produk disusun bagaimana?

**Keputusan:** Preview besar (klik untuk lightbox) → judul, nama toko, rating → pilihan tipe jual A/B/C dengan harga → deskripsi lengkap → info file (ukuran .zip, isi) → review → produk serupa.

#### PRD-03-07 — Tampilan produk Booked

**Referensi:** SPEC-03-07.

**Konteks keputusan:** Bagaimana tampilan produk yang sedang berstatus “Booked” (ada order menunggu verifikasi) di katalog dan halaman detailnya?

**Keputusan:** Produk tetap bisa dibeli buyer lain secara paralel tanpa antrian.

#### PRD-03-08 — Rating di kartu katalog

**Referensi:** SPEC-03-08.

**Konteks keputusan:** Elemen rating seperti apa yang ditampilkan di kartu katalog?

**Keputusan:** Bintang + jumlah review ringkas, contoh “4.8 (23)” — detail ulasan tetap di halaman detail.

### 6.4. Alur Checkout & Pembayaran

#### PRD-04-01 — Guest checkout vs wajib akun

**Referensi:** SPEC-04-01.

**Konteks keputusan:** Checkout: bolehkah buyer membeli sebagai guest tanpa membuat akun?

**Keputusan:** Wajib punya akun (email + password atau Google) sebelum masuk halaman checkout; registrasi bisa diselesaikan dari halaman produk tanpa kehilangan konteks.

#### PRD-04-02 — Batas waktu Booked

**Referensi:** SPEC-04-02.

**Konteks keputusan:** Berapa batas waktu status “Booked” / “Menunggu Verifikasi” sebelum order kedaluwarsa dan produk dilepas?

**Keputusan:** (Ketik sendiri) Booked disini seperti "Tambahkan ke keranjang" di Shoopee. jadi, buyer bisa mengeluarkan sendiri produk booked kapan saja dari keranjang.

#### PRD-04-03 — Sumber nomor WhatsApp fallback

**Referensi:** SPEC-04-03.

**Konteks keputusan:** Saat kedua AI key gagal dan buyer diarahkan ke WhatsApp seller: dari mana nomor seller berasal dan bagaimana ditampilkan?

**Keputusan:** Nomor WA diambil dari field wajib saat onboarding seller (divalidasi format Indonesia), dirender sebagai tombol “Hubungi via WhatsApp” dengan pesan template berisi ID order dan nama produk.

#### PRD-04-04 — Spesifikasi upload bukti

**Referensi:** SPEC-04-04.

**Konteks keputusan:** Spesifikasi upload bukti transfer oleh buyer: format, ukuran, dan validasinya?

**Keputusan:** Satu gambar per percobaan, format JPG/PNG/HEIC maksimal 5 MB, wajib melalui layar preview sebelum submit, ditolak di sisi client jika bukan gambar valid.

#### PRD-04-05 — Set status order buyer

**Referensi:** SPEC-04-05.

**Konteks keputusan:** Set status order yang dilihat buyer: apa saja dan bagaimana divisualisasikan?

**Keputusan:** (Ketik sendiri) Enam status: Menunggu Pembayaran → Menunggu Verifikasi → Booked (jalur manual) → Lunas (file terbuka) → Dibatalkan → Kedaluwarsa, ditampilkan sebagai timeline stepper dengan timestamp tiap perubahan. seperti yang sudah saya bilang, jangan pernah menampilkan link google drive nya. jadi, link tersebut berada didalam button yang mana button tersebut ketika diklik, file .zip nya akan terdownload tanpa redirect ke google drive

#### PRD-04-06 — Notifikasi email buyer

**Referensi:** SPEC-04-06.

**Konteks keputusan:** Notifikasi email ke buyer dikirim di momen-momen apa saja?

**Keputusan:** Empat email: order dibuat (berisi instruksi bayar + QR), bukti diterima dan sedang diverifikasi, verifikasi berhasil (berisi akses file), verifikasi gagal (berisi alasan dan cara upload ulang).

#### PRD-04-07 — Notifikasi seller

**Referensi:** SPEC-04-07.

**Konteks keputusan:** Notifikasi ke seller untuk order baru dan aksi manual: kanal dan bentuknya?

**Keputusan:** Email untuk semua event order, ditambah badge counter menonjol di dashboard seller untuk order yang menunggu aksi manual.

#### PRD-04-08 — Hak batalkan order

**Referensi:** SPEC-04-08.

**Konteks keputusan:** Kapan buyer boleh membatalkan order yang dia buat?

**Keputusan:** Selama status masih “Menunggu Pembayaran” atau “Menunggu Verifikasi”, buyer bisa batalkan sendiri satu klik; setelah Lunas, hanya lewat jalur dispute.

### 6.5. Auth & Akun

#### PRD-05-01 — Metode login utama

**Referensi:** SPEC-05-01.

**Konteks keputusan:** Metode login utama yang ditawarkan di halaman masuk?

**Keputusan:** Email + password sebagai jalur utama, dengan tombol “Lanjutkan dengan Google” sebagai alternatif yang setara.

#### PRD-05-02 — Kewajiban verifikasi email

**Referensi:** SPEC-05-02.

**Konteks keputusan:** Verifikasi email: wajib atau tidak, dan di titik apa dipaksa?

**Keputusan:** Wajib verifikasi sebelum checkout pertama, bukan sebelum bisa melihat-lihat katalog; link verifikasi kedaluwarsa dalam 24 jam dan bisa dikirim ulang.

#### PRD-05-03 — Mekanisme reset password

**Referensi:** SPEC-05-03.

**Konteks keputusan:** Mekanisme lupa password seperti apa yang diimplementasikan?

**Keputusan:** Email berisi link reset sekali-pakai yang kedaluwarsa dalam 1 jam; token disimpan ter-hash di database; setelah reset, semua session lama diturunkan.

#### PRD-05-04 — Satu akun banyak toko

**Referensi:** SPEC-05-04.

**Konteks keputusan:** Apakah satu akun boleh memiliki lebih dari satu toko?

**Keputusan:** Satu akun = satu toko untuk fase awal; kebutuhan multi-toko ditunda sampai ada seller nyata yang memintanya.

#### PRD-05-05 — Naik role jadi seller

**Referensi:** SPEC-05-05.

**Konteks keputusan:** Bagaimana seorang buyer menjadi seller? Apa mekanisme kenaikan perannya?

**Keputusan:** Semua akun otomatis berperan buyer; menjadi seller dilakukan lewat onboarding khusus (data toko + QR + API key semi-optional) tanpa approval manusia; kontrol kualitas dilakukan di verifikasi produk.

#### PRD-05-06 — Cakupan settings akun

**Referensi:** SPEC-05-06.

**Konteks keputusan:** Halaman Settings akun minimal mencakup apa saja?

**Keputusan:** Ubah nama, ganti password, ganti email (wajib re-verifikasi), preferensi email notifikasi, dan hapus akun (soft-delete dengan masa tenggang 30 hari).

#### PRD-05-07 — Durasi session login

**Referensi:** SPEC-05-07.

**Konteks keputusan:** Berapa lama sesi login bertahan sebelum user diminta masuk kembali?

**Keputusan:** 30 hari dengan opsi “Ingat saya di perangkat ini” dicentang; tanpa itu 1 hari; logout manual selalu tersedia.

### 6.6. Onboarding Seller

#### PRD-06-01 — Urutan langkah onboarding

**Referensi:** SPEC-06-01.

**Konteks keputusan:** Urutan langkah onboarding seller disusun bagaimana?

**Keputusan:** Empat langkah berurutan: (1) profil toko (nama, slug, deskripsi), (2) unggah QR pembayaran, (3) API key AI semi-optional dengan penjelasan konsekuensi, (4) tambah produk pertama dan kirim verifikasi.

#### PRD-06-02 — Validasi setup QR

**Referensi:** SPEC-06-02.

**Konteks keputusan:** Saat seller mengunggah QR pembayaran, validasi apa yang dilakukan sistem?

**Keputusan:** Wajib gambar JPG/PNG maksimal 2 MB dengan preview besar, plus checkbox pernyataan “Saya sudah menguji scan QR ini dan nominalnya masuk ke rekening saya”.

#### PRD-06-03 — Seller skip API key

**Referensi:** SPEC-06-03.

**Konteks keputusan:** Bagaimana menyikapi seller yang menekan “Lewati” pada langkah setup API key AI?

**Keputusan:** Lewati diperbolehkan dengan konsekuensi yang ditulis eksplisit di layar (“Semua order harus Anda approve manual”), dan langkah ini bisa diisi belakangan di Settings toko.

#### PRD-06-04 — Minimum sebelum toko live

**Referensi:** SPEC-06-04.

**Konteks keputusan:** Kapan tepatnya sebuah toko baru dianggap “live” dan tampil untuk publik?

**Keputusan:** Setelah memiliki minimal 1 produk berstatus terverifikasi (lolos inspeksi); sebelum itu toko berstatus “Disiapkan” yang hanya terlihat oleh pemiliknya.

#### PRD-06-05 — Draft onboarding tersimpan

**Referensi:** SPEC-06-05.

**Konteks keputusan:** Jika seller berhenti di tengah onboarding (misalnya setelah langkah 2), apa yang terjadi pada datanya?

**Keputusan:** Setiap langkah tersimpan otomatis sebagai draft; dashboard menampilkan checklist “Toko Anda X% siap” dengan tombol langsung ke langkah yang belum selesai.

#### PRD-06-06 — Layar sukses onboarding

**Referensi:** SPEC-06-06.

**Konteks keputusan:** Apa yang seller lihat tepat setelah menyelesaikan seluruh onboarding?

**Keputusan:** Halaman “Toko Anda siap” berisi 3 langkah berikutnya: bagikan link toko, kirim produk pertama untuk verifikasi, dan kenali halaman Komisi & Tagihan — dengan status verifikasi yang terlihat realtime.

### 6.7. AI Receipt Scanner

#### PRD-07-01 — Toleransi nominal pencocokan

**Referensi:** SPEC-07-01.

**Konteks keputusan:** Aturan pencocokan nominal antara bukti transfer dan harga tipe jual yang dipilih: berapa toleransinya?

**Keputusan:** (Ketik sendiri) nominal di bukti harus persis sama; kurang dari itu ditolak otomatis sebagai kurang bayar, lebih dari itu ditandai untuk review manual dan menghubungi seller untuk melaporkan.

#### PRD-07-02 — Toleransi waktu transfer

**Referensi:** SPEC-07-02.

**Konteks keputusan:** Toleransi waktu pada bukti transfer: bagaimana timestamp di bukti dicocokkan dengan sesi order?

**Keputusan:** Bukti harus dibuat dalam jendela sesi order: sejak buyer menekan “Bayar Sekarang” hingga batas kedaluwarsa order; timestamp lebih lama dari itu ditolak.

#### PRD-07-03 — Peran nama pengirim

**Referensi:** SPEC-07-03.

**Konteks keputusan:** Bagaimana nama pengirim di bukti transfer diperlakukan dalam keputusan verifikasi?

**Keputusan:** Nama pengirim dibaca AI dan ditampilkan sebagai informasi pendukung di UI, tapi bukan syarat lolos-gagal yang keras.

#### PRD-07-04 — Deteksi bukti dipakai ulang

**Referensi:** SPEC-07-04.

**Konteks keputusan:** Bagaimana sistem mendeteksi bukti transfer yang dipakai ulang untuk order berbeda?

**Keputusan:** Setiap bukti yang lolos disimpan perceptual hash + file hash-nya; bukti baru yang hash-nya cocok dengan riwayat ditolak otomatis dengan alasan “bukti duplikat”.

#### PRD-07-05 — Deteksi bukti dimanipulasi

**Referensi:** SPEC-07-05.

**Konteks keputusan:** Bagaimana menangani dugaan bukti transfer yang dimanipulasi (nominal diedit di screenshot)?

**Keputusan:** Dua lapis: AI diminta menilai indikasi manipulasi (font tidak konsisten, artefak edit, metadata), dan cross-check logika nominal-format; hasil “curiga” masuk antrian review manual dengan area yang dicurigai ditandai.

#### PRD-07-06 — Lokasi penyimpanan bukti .webp

**Referensi:** SPEC-07-06.

**Konteks keputusan:** Di mana dan bagaimana file bukti .webp disimpan setelah lolos verifikasi?

**Keputusan:** Supabase Storage bucket private dengan path receipts/{orderId}/{timestamp}.webp; akses hanya lewat signed URL berumur pendek yang diterbitkan API.

#### PRD-07-07 — Retensi & penghapusan bukti

**Referensi:** SPEC-07-07.

**Konteks keputusan:** Berapa lama bukti transfer disimpan dan kapan dihapus?

**Keputusan:** (Ketik sendiri) 30 hari untuk kebutuhan dispute; setelah itu job terjadwal menghapus file fisiknya sementara metadata transaksi tetap di database.

#### PRD-07-08 — Enkripsi & validasi API key

**Referensi:** SPEC-07-08.

**Konteks keputusan:** API key BYOK seller: bagaimana dienkripsi dan divalidasi saat pertama kali disimpan?

**Keputusan:** Dienkripsi at-rest dengan AES-256-GCM memakai key dari environment Vercel, divalidasi dengan satu panggilan test murah saat disimpan, dan hanya pernah ditampilkan ter-mask (mis. AIza...9f2c) setelahnya.

#### PRD-07-09 — Rotasi API key

**Referensi:** SPEC-07-09.

**Konteks keputusan:** Bagaimana mekanisme rotasi (penggantian) API key oleh seller?

**Keputusan:** Seller bisa menekan “Ganti key” kapan saja di Settings toko; key lama langsung nonaktif; jika key gagal 3 kali berturut-turut, sistem mengirim email pengingat untuk rotasi.

#### PRD-07-10 — Prosedur kedua key gagal

**Referensi:** SPEC-07-10.

**Konteks keputusan:** Saat primary dan fallback key sama-sama gagal (selain tombol WhatsApp ke seller), apa yang sistem lakukan di belakang layar?

**Keputusan:** Order masuk antrian “Perlu Tindakan” di dashboard seller, buyer menerima email berisi instruksi kontak WA beserta ID order, dan status Booked memegang lock produk maksimal 24 jam.

### 6.8. Verifikasi Produk & MCP

#### PRD-08-01 — Struktur laporan inspeksi

**Referensi:** SPEC-08-01.

**Konteks keputusan:** Struktur laporan Markdown hasil skrip inspeksi Node.js berisi apa saja?

**Keputusan:** Struktur tetap: status link Drive (OK / 404 / private), status HTTP live demo + screenshot desktop, ukuran file .zip, hash file, dan timestamp inspeksi.

#### PRD-08-02 — Aturan reject otomatis

**Referensi:** SPEC-08-02.

**Konteks keputusan:** Kondisi apa yang memicu reject otomatis tanpa perlu review manusia?

**Keputusan:** Link Drive mati (404 atau private) ATAU live demo merespons HTTP 500 ke atas: langsung direject dengan email alasan ke seller dan tombol “Perbaiki & Kirim Ulang”.

#### PRD-08-03 — Batas perbaikan produk reject

**Referensi:** SPEC-08-03.

**Konteks keputusan:** Berapa lama seller boleh memperbaiki produk yang berstatus ditolak?

**Keputusan:** 14 hari sebelum produk otomatis masuk arsip, dengan email pengingat otomatis di hari ke-7.

#### PRD-08-04 — Otorisasi MCP server

**Referensi:** SPEC-08-04.

**Konteks keputusan:** MCP server yang dipakai AI untuk verifikasi: bagaimana otorisasi dan keamanannya?

**Keputusan:** Endpoint MCP hanya menerima request dengan secret token dari environment, tidak diekspos publik, dan setiap pemanggilan tercatat di log audit.

#### PRD-08-05 — Batasan aksi AI via MCP

**Referensi:** SPEC-08-05.

**Konteks keputusan:** Seberapa jauh AI (lewat MCP) boleh bertindak dalam keputusan verifikasi produk?

**Keputusan:** AI boleh membaca laporan inspeksi dan data produk, lalu mengusulkan keputusan (approve/reject beserta alasan); eksekusi final tetap menunggu satu klik konfirmasi Super-Admin.

#### PRD-08-06 — Isi audit trail verifikasi

**Referensi:** SPEC-08-06.

**Konteks keputusan:** Apa saja yang dicatat di audit trail setiap kali verifikasi produk terjadi?

**Keputusan:** Setiap aksi tercatat: aktor (sistem otomatis / Super-Admin / AI), timestamp, payload ringkas (produk, laporan), dan hasil keputusan beserta alasannya.

### 6.9. Komisi & Penagihan

#### PRD-09-01 — Suspend: nasib produk & order

**Referensi:** SPEC-09-01.

**Konteks keputusan:** Ketika toko di-suspend karena menunggak komisi, apa persisnya yang terjadi pada produk dan order yang sedang berjalan?

**Keputusan:** Produk disembunyikan dari katalog; order berstatus Lunas tetap bisa mengakses filenya; order Menunggu Verifikasi/Booked diberi tenggat 24 jam untuk diselesaikan manual oleh seller.

#### PRD-09-02 — Grace period penagihan

**Referensi:** SPEC-09-02.

**Konteks keputusan:** Berapa grace period yang diberikan sebelum suspend menunggak dieksekusi, dan bagaimana ritmenya?

**Keputusan:** 7 hari setelah invoice terbit: email reminder di hari ke-1, ke-3, dan ke-5; suspend otomatis di hari ke-8 bila belum dibayar.

#### PRD-09-03 — Bentuk reminder penagihan

**Referensi:** SPEC-09-03.

**Konteks keputusan:** Bentuk reminder penagihan komisi seperti apa yang dikirim ke seller?

**Keputusan:** Email otomatis (Nodemailer) berisi jumlah tunggakan, cara bayar, batas tanggal suspend, ditambah banner kuning di dashboard seller saat tersisa 3 hari sebelum suspend.

#### PRD-09-04 — Nilai threshold invoice

**Referensi:** SPEC-09-04.

**Konteks keputusan:** Berapa nilai threshold invoice komisi (jumlah Commission Owed yang memicu invoice otomatis)?

**Keputusan:** Rp25.000 (setara 25 transaksi terverifikasi), dapat diubah Super-Admin di Settings.

#### PRD-09-05 — Pencatatan order batal

**Referensi:** SPEC-09-05.

**Konteks keputusan:** Bagaimana transaksi yang dibatalkan atau kedaluwarsa diperlakukan dalam pencatatan komisi?

**Keputusan:** Order batal/kedaluwarsa tidak pernah masuk “Commission Owed”; komisi hanya dicatat saat transaksi terverifikasi, dalam ledger terpisah per event.

#### PRD-09-06 — Data verifikasi bukti komisi

**Referensi:** SPEC-09-06.

**Konteks keputusan:** Ketika Super-Admin memverifikasi bukti pembayaran komisi secara manual, data apa yang dicatat di sistem?

**Keputusan:** Form verifikasi berisi: pilih invoice, nominal diterima, tanggal bayar, metode (transfer/e-wallet), dan referensi opsional; setelah disimpan status invoice menjadi Lunas dan counter reset ke nol.

### 6.10. Trust & Safety

#### PRD-10-01 — Moderasi pra-publikasi

**Referensi:** SPEC-10-01.

**Konteks keputusan:** Lapisan moderasi apa yang diterapkan pada produk sebelum tampil publik?

**Keputusan:** Dua lapis: verifikasi teknis otomatis (link Drive, live demo) lewat skrip inspeksi, ditambah review singkat Super-Admin atas deskripsi, preview, dan harga untuk menangkap konten ilegal atau menyesatkan.

#### PRD-10-02 — Alur takedown

**Referensi:** SPEC-10-02.

**Konteks keputusan:** Bagaimana alur takedown produk bekerja dan siapa yang bisa memicunya?

**Keputusan:** Super-Admin bisa takedown kapan saja namun wajib mengisi alasan terstruktur; seller menerima email alasan tersebut dan bisa mengajukan banding lewat jalur dispute.

#### PRD-10-03 — Kategori laporan abuse

**Referensi:** SPEC-10-03.

**Konteks keputusan:** Tombol laporkan produk: kategori laporan apa yang dipilih pelapor?

**Keputusan:** Lima kategori tetap: Konten ilegal, Plagiarisme, Isi tidak sesuai deskripsi, Penipuan pembayaran, Lainnya — plus field detail opsional.

#### PRD-10-04 — Kriteria refund buyer

**Referensi:** SPEC-10-04.

**Konteks keputusan:** Kebijakan refund (yang diproses manual Super-Admin sebagai mediator): kapan buyer dianggap layak didukung?

**Keputusan:** Refund didukung bila: file tidak bisa diakses, isi berbeda drastis dari deskripsi, atau seller tidak merespons 48 jam; “tidak cocok selera” bukan dasar refund.

#### PRD-10-05 — Aturan penulisan review

**Referensi:** SPEC-10-05.

**Konteks keputusan:** Siapa yang boleh menulis review, dan apa aturan penulisannya?

**Keputusan:** Hanya buyer dengan order Lunas pada produk tersebut, satu review per pembelian, berisi rating + teks, dan boleh diedit sendiri dalam 7 hari pertama.

#### PRD-10-06 — Penghapusan review

**Referensi:** SPEC-10-06.

**Konteks keputusan:** Bisakah seller menghapus review yang merugikan mereka? Bagaimana review yang melanggar aturan ditangani?

**Keputusan:** Seller tidak bisa menghapus review, hanya bisa membalas satu kali secara publik; review yang melanggar (hujatan, doxing, spam) hanya bisa dihapus Super-Admin dengan alasan tercatat.

#### PRD-10-07 — Tangga sanksi seller

**Referensi:** SPEC-10-07.

**Konteks keputusan:** Bagaimana tangga sanksi untuk seller yang melanggar aturan platform?

**Keputusan:** Empat tingkat eskalasi: peringatan email → suspend listing 7 hari → suspend toko sampai pelanggaran beres → banned permanen dengan pemblokiran email dan pola perangkat.

### 6.11. Delivery File

#### PRD-11-01 — Link Drive mati pasca-jual

**Referensi:** SPEC-11-01.

**Konteks keputusan:** Bagaimana platform mendeteksi dan merespons link Google Drive yang mati atau dihapus seller SETELAH produk terjual?

**Keputusan:** Re-inspeksi berkala mingguan untuk semua produk aktif; saat link mati, produk otomatis di-unlist, seller diberi tenggat 72 jam untuk memperbaiki sebelum listing disuspend.

#### PRD-11-02 — Perlindungan link delivery

**Referensi:** SPEC-11-02.

**Konteks keputusan:** Bagaimana link Google Drive dilindungi agar tidak bocor ke orang yang belum membeli?

**Keputusan:** Link Drive tidak pernah tampil mentah; buyer mengakses via endpoint redirect /api/download/[orderId] yang memvalidasi session dan status Lunas, baru 302 ke link Drive; setiap akses tercatat di log.

#### PRD-11-03 — Batas jumlah download

**Referensi:** SPEC-11-03.

**Konteks keputusan:** Berapa batas jumlah download file per order oleh buyer?

**Keputusan:** Hanya 1 kali download, tanpa kecuali dan tanpa reset.

#### PRD-11-04 — Update produk untuk buyer lama

**Referensi:** SPEC-11-04.

**Konteks keputusan:** Ketika seller mengupdate isi produk (.zip revisi), bagaimana buyer lama mendapatkan pembaruan?

**Keputusan:** File lama langsung ditimpa tanpa notifikasi ke buyer yang sudah membeli.

#### PRD-11-05 — Ganti link Drive produk

**Referensi:** SPEC-11-05.

**Konteks keputusan:** Jika seller mengganti link Drive sebuah produk (misalnya pindah akun Drive), mekanisme apa yang berjalan?

**Keputusan:** Penggantian link memicu verifikasi ulang singkat (cek link baru hidup dan publik) sebelum produk aktif kembali; hash file dihitung ulang untuk mendeteksi perubahan isi.

#### PRD-11-06 — Bukti kepemilikan buyer

**Referensi:** SPEC-11-06.

**Konteks keputusan:** Di mana buyer melihat bukti kepemilikan atas semua produk yang pernah dia beli (untuk akses ulang jangka panjang)?

**Keputusan:** Halaman “Koleksi Saya” permanen di akun buyer: semua order Lunas dengan tombol download, info versi, dan tanggal beli.

### 6.12. Prompt Generator (Gaya M3E Canvas)

#### PRD-12-01 — Target pengguna generator

**Referensi:** SPEC-12-01.

**Konteks keputusan:** Prompt Generator ditujukan untuk siapa di peluncuran pertamanya?

**Keputusan:** Publik tanpa login untuk mencoba, dengan ekspor terbatas; akun terdaftar membuka ekspor penuh dan integrasi marketplace.

#### PRD-12-02 — Model harga generator

**Referensi:** SPEC-12-02.

**Konteks keputusan:** Apakah Prompt Generator gratis atau berbayar?

**Keputusan:** Gratis penuh di fase awal sebagai alat akuisisi dan demo kualitas prompt; monetisasi nanti lewat template prompt premium di marketplace.

#### PRD-12-03 — Set komponen blok prompt

**Referensi:** SPEC-12-03.

**Konteks keputusan:** Komponen (blok) apa saja yang tersedia di canvas pembangun prompt?

**Keputusan:** Tujuh blok inti: Peran (Role), Tugas (Task), Konteks, Format Output, Batasan (Constraints), Contoh (Examples), dan Tone/Gaya.

#### PRD-12-04 — Interaksi canvas drag-drop

**Referensi:** SPEC-12-04.

**Konteks keputusan:** Interaksi drag-drop canvas bagaimana diimplementasikan di versi pertama?

**Keputusan:** Kolom vertikal drag-and-reorder dengan drag handle per blok; urutan blok menentukan urutan struktur prompt akhir.

#### PRD-12-05 — Format ekspor prompt

**Referensi:** SPEC-12-05.

**Konteks keputusan:** Format ekspor prompt terstruktur yang disediakan?

**Keputusan:** Tiga format: Markdown terstruktur, plain text siap-tempel ke chat AI, dan JSON dengan tiap blok sebagai key.

#### PRD-12-06 — Integrasi dengan marketplace

**Referensi:** SPEC-12-06.

**Konteks keputusan:** Bagaimana Prompt Generator terintegrasi dengan produk di marketplace?

**Keputusan:** Tombol “Coba di Generator” di halaman detail produk tipe “Prompt saja”; struktur prompt terjual tampil sebagai template read-only di canvas, dengan isi tersembunyi sampai pembelian selesai.

### 6.13. Halaman Tambahan

#### PRD-13-01 — Isi profil publik toko

**Referensi:** SPEC-13-01.

**Konteks keputusan:** Halaman profil publik toko berisi apa saja dan berada di URL seperti apa?

**Keputusan:** URL /toko/{slug} menampilkan branding, warna aksen, deskripsi, ikon sosial media, statistik publik (jumlah produk, rating rata-rata, tahun bergabung), dan grid produknya.

#### PRD-13-02 — Cakupan notification center

**Referensi:** SPEC-13-02.

**Konteks keputusan:** Notification center in-app mencakup notifikasi apa saja?

**Keputusan:** Ikon lonceng dengan panel berisi: update order, hasil verifikasi produk, tagihan komisi/invoice, dan update produk yang dibeli — lengkap dengan penanda belum-baca dan link ke objek terkait.

#### PRD-13-03 — Isi halaman settings user

**Referensi:** SPEC-13-03.

**Konteks keputusan:** Halaman Settings untuk semua user (buyer maupun seller) berisi preferensi apa?

**Keputusan:** Tema tampilan (Dark/Light/System), bahasa email notifikasi (ID/EN), dan preferensi email promosi yang bisa dimatikan.

#### PRD-13-04 — Gaya halaman 404/error

**Referensi:** SPEC-13-04.

**Konteks keputusan:** Halaman 404 dan error (500) dirancang seperti apa?

**Keputusan:** Mengikuti bahasa visual landing page: hero Gradient ASCII, pesan singkat, dan tiga tautan pemulihan (katalog, produk terlaris, halaman sebelumnya); varian 500 menampilkan “tim sudah diberi tahu”.

#### PRD-13-05 — Perlunya halaman status

**Referensi:** SPEC-13-05.

**Konteks keputusan:** Apakah platform butuh halaman status (status page) di fase awal?

**Keputusan:** Ya, versi sederhana di /status: kesehatan Neon, Supabase Storage, dan endpoint kritis; diperbarui manual saat insiden ditambah halaman statis sehari-hari.

### 6.14. Legal

#### PRD-14-01 — Klausul AI pihak ketiga

**Referensi:** SPEC-14-01.

**Konteks keputusan:** Bagaimana Privacy Policy menyatakan pemrosesan gambar bukti transfer oleh AI pihak ketiga (Gemini via BYOK seller)?

**Keputusan:** Klausul eksplisit: gambar bukti diproses oleh layanan AI pihak ketiga yang dipilih seller (memakai API key milik seller); data dikirim langsung ke penyedia tersebut; Althentic tidak menyimpan salinan hasil proses; gambar disimpan maksimal 90 hari lalu dihapus.

#### PRD-14-02 — Perlakuan data finansial

**Referensi:** SPEC-14-02.

**Konteks keputusan:** Bagaimana data finansial (QR seller, nominal transaksi, ledger komisi) diperlakukan secara legal?

**Keputusan:** Digolongkan sebagai “data transaksi”: disimpan selama akun aktif ditambah 5 tahun mengikuti kebiasaan pembukuan, dengan akses terbatas hanya Super-Admin.

#### PRD-14-03 — Mekanisme persetujuan ToS

**Referensi:** SPEC-14-03.

**Konteks keputusan:** Mekanisme persetujuan pengguna atas ToS dan Privacy Policy seperti apa?

**Keputusan:** Checkbox wajib saat pendaftaran + banner re-consent saat ada perubahan material (menampilkan ringkasan perubahan); versi dokumen dan tanggal persetujuan dicatat per akun.

#### PRD-14-04 — Posisi pajak platform

**Referensi:** SPEC-14-04.

**Konteks keputusan:** Bagaimana posisi platform terhadap kewajiban pajak atas transaksi seller?

**Keputusan:** Dinyatakan eksplisit: Althentic hanya menarik komisi layanan; seluruh kewajiban pajak atas penjualan menjadi tanggung jawab seller; platform menyediakan ringkasan transaksi tahunan untuk membantu pembukuan.

#### PRD-14-05 — Usia minimum pengguna

**Referensi:** SPEC-14-05.

**Konteks keputusan:** Berapa usia minimum pengguna platform dan bagaimana ditegakkan?

**Keputusan:** Minimal 17 tahun, dinyatakan di ToS dan dikonfirmasi lewat checkbox pernyataan usia saat pendaftaran.

#### PRD-14-06 — Yurisdiksi & hukum

**Referensi:** SPEC-14-06.

**Konteks keputusan:** Hukum dan yurisdiksi mana yang berlaku untuk ToS dan sengketa?

**Keputusan:** Hukum Indonesia dengan domisili hukum di kota domisili pemilik platform; mediasi wajib sebelum litigasi; ToS ditulis dalam bahasa Indonesia dengan ringkasan bahasa Inggris yang tidak mengikat.

### 6.15. Teknis & Infrastruktur

#### PRD-15-01 — Pembagian Neon vs Supabase

**Referensi:** SPEC-15-01.

**Konteks keputusan:** Bagaimana pembagian tugas yang disiplin antara Neon (database) dan Supabase Storage (file)?

**Keputusan:** Neon menyimpan semua data relasional (users, products, orders, ledger komisi, metadata bukti); Supabase Storage hanya menyimpan file biner (bukti .webp, banner, preview) dalam bucket publik dan private terpisah.

#### PRD-15-02 — Pilihan ORM

**Referensi:** SPEC-15-02.

**Konteks keputusan:** ORM mana yang dipilih untuk berinteraksi dengan Neon Postgres, dan mengapa?

**Keputusan:** Prisma: schema-first, migration tool matang, type generation kuat, dan dokumentasi melimpah — cocok untuk pengembang solo yang harus cepat jalan dengan aman.

#### PRD-15-03 — Strategi rate limiting

**Referensi:** SPEC-15-03.

**Konteks keputusan:** Strategi rate limiting di lingkungan serverless Vercel yang tidak punya memori bersama?

**Keputusan:** Rate limit berbasis Upstash Redis REST (free tier) dengan sliding window per-IP+user pada endpoint sensitif: login, upload bukti, dan submit order.

#### PRD-15-04 — Keamanan API route

**Referensi:** SPEC-15-04.

**Konteks keputusan:** Lapisan keamanan wajib di setiap API route adalah apa saja?

**Keputusan:** Validasi input dengan Zod di setiap route, cek session di dalam route (tidak percaya middleware semata), otorisasi per-ownership (buyer hanya menyentuh order miliknya), dan error response yang tidak membocorkan stack.

#### PRD-15-05 — Logging & monitoring

**Referensi:** SPEC-15-05.

**Konteks keputusan:** Stack logging dan monitoring minimal yang dipakai di fase awal?

**Keputusan:** Structured logging JSON konsisten dilihat lewat Vercel Logs, plus alert email via Nodemailer untuk error kritis (verifikasi gagal massal, koneksi DB gagal).

#### PRD-15-06 — Strategi backup Neon

**Referensi:** SPEC-15-06.

**Konteks keputusan:** Strategi backup untuk database Neon seperti apa?

**Keputusan:** Mengandalkan point-in-time restore bawaan Neon, ditambah pg_dump otomatis bulanan via GitHub Actions terjadwal yang disimpan di storage pribadi — dengan uji restore berkala.

#### PRD-15-07 — Inspeksi Puppeteer di Vercel

**Referensi:** SPEC-15-07.

**Konteks keputusan:** Inspeksi Puppeteer untuk verifikasi produk kena batas serverless Vercel; bagaimana solusinya?

**Keputusan:** Jangan jalankan browser penuh di Vercel: cek status link via fetch HTTP biasa, screenshot via API screenshot free-tier, dan bila perlu browser penuh, jalankan skrip dari mesin lokal Super-Admin lalu unggah laporannya.

### 6.16. Pertanyaan Gap — Celah yang Belum Terpikirkan

Bagian ini mencakup strategi, batas operasional dan fase lanjutan. Tidak semua butir merupakan fitur untuk peluncuran pertama; konteks pertanyaan tetap berlaku.

#### PRD-16-01 — Deteksi prompt curian

**Referensi:** SPEC-16-01.

**Konteks keputusan:** Seller bisa menjual prompt yang dicuri dari marketplace lain. Bagaimana lapisan deteksi pertamanya?

**Keputusan:** Deteksi otomatis antar produk di katalog Althentic sendiri saja.

#### PRD-16-02 — Sengketa isi tidak sesuai

**Referensi:** SPEC-16-02.

**Konteks keputusan:** Buyer komplain “isi prompt di dalam .zip tidak sesuai janji” padahal deskripsi terlihat benar. Bagaimana proses klarifikasinya?

**Keputusan:** Seller wajib menunjukkan bukti isi (screenshot terstruktur atau walkthrough singkat) dalam 48 jam lewat dispute; terbukti sesuai: tetap lunas dengan catatan; tidak sesuai: refund manual plus poin sanksi seller.

#### PRD-16-03 — Risiko monokultur seller

**Referensi:** SPEC-16-03.

**Konteks keputusan:** Bagaimana jika satu seller menguasai 80% katalog (risiko monokultur)? Apa sikap platform?

**Keputusan:** Tambahkan metrik “konsentrasi top-1 seller” di dashboard Super-Admin sebagai sinyal untuk mempercepat rekrutmen seller, tanpa pembatasan eksplisit terhadap seller produktif.

#### PRD-16-04 — Ketergantungan pihak ketiga

**Referensi:** SPEC-16-04.

**Konteks keputusan:** Platform bergantung pada Google Drive (delivery) dan Gemini (verifikasi). Apa persiapan bila harga atau kebijakan keduanya berubah drastis?

**Keputusan:** Dokumentasikan abstraksi: modul delivery dan modul AI scanner masing-masing punya satu interface tunggal sehingga bisa ganti provider dengan menyentuh 1–2 file saja; digunakan saat benar-benar dibutuhkan.

#### PRD-16-05 — Komisi vs produk super murah

**Referensi:** SPEC-16-05.

**Konteks keputusan:** Bagaimana nasib komisi Rp1.000 flat ketika ada seller menjual produk super murah, misalnya Rp3.000?

**Keputusan:** Tetap Rp1.000 flat tanpa pengecualian harga.

#### PRD-16-06 — Monetisasi fase kedua

**Referensi:** SPEC-16-06.

**Konteks keputusan:** Selain komisi, monetisasi mana yang paling layak diprioritaskan di fase kedua?

**Keputusan:** Featured listing: produk tampil di posisi teratas katalog/beranda selama 7 hari dengan harga tetap.

#### PRD-16-07 — Rekrutmen 10 seller pertama

**Referensi:** SPEC-16-07.

**Konteks keputusan:** Bagaimana strategi mendapatkan 10 seller pertama (di luar pemilik platform sendiri)?

**Keputusan:** Undangan personal terkurasi: cari 5–10 pembuat prompt yang karyanya sudah bagus di komunitas (X, Discord AI Indonesia), tawarkan onboarding dibantu langsung dan featured listing gratis 30 hari.

#### PRD-16-08 — Strategi 100 buyer pertama

**Referensi:** SPEC-16-08.

**Konteks keputusan:** Bagaimana strategi mendapatkan 100 buyer pertama?

**Keputusan:** Konten dulu: rilis 3–5 prompt gratis berkualitas tinggi dari toko pemilik, dibagikan di komunitas AI dengan CTA menuju marketplace.

#### PRD-16-09 — Penjagaan kualitas prompt

**Referensi:** SPEC-16-09.

**Konteks keputusan:** Bagaimana kualitas isi prompt di katalog dijaga (bukan cuma link yang hidup)?

**Keputusan:** Tidak ada penilaian kualitas; semua prompt yang link-nya hidup boleh dijual.

#### PRD-16-10 — Hak cipta & larangan resell

**Referensi:** SPEC-16-10.

**Konteks keputusan:** Apa batasan lisensi buyer atas prompt yang dibeli? Bolehkah dijual ulang di Althentic?

**Keputusan:** ToS menyatakan: lisensi penggunaan personal dan komersial atas output, dilarang menjual ulang atau mendistribusikan file prompt mentah; pelanggaran berujung banned.

#### PRD-16-11 — Diferensiasi vs kompetitor

**Referensi:** SPEC-16-11.

**Konteks keputusan:** Terhadap kompetitor seperti PromptBase, diferensiasi mana yang dipertahankan mati-matian?

**Keputusan:** Lokalisasi penuh: pembayaran QR lokal tanpa kartu internasional, kurasi dan komunitas berbahasa Indonesia, harga Rupiah.

#### PRD-16-12 — Deteksi self-buying

**Referensi:** SPEC-16-12.

**Konteks keputusan:** Bagaimana mendeteksi seller yang membeli produknya sendiri (akun kedua) untuk memanipulasi rating dan metrik terlaris?

**Keputusan:** Verifikasi transaksi mencocokkan sinyal: akun buyer dengan IP/device fingerprint yang sama dengan seller ditandai; transaksi self-buy tidak dihitung ke metrik terlaris dan ratingnya diflag untuk review.

#### PRD-16-13 — Risiko bus factor Super-Admin

**Referensi:** SPEC-16-13.

**Konteks keputusan:** Jika satu-satunya Super-Admin sakit atau tidak bisa mengakses internet selama 2 minggu, apa yang terjadi pada operasi kritis?

**Keputusan:** Terima risiko platform berhenti total selama itu.

#### PRD-16-14 — Rencana insiden data

**Referensi:** SPEC-16-14.

**Konteks keputusan:** Data apa yang paling fatal jika bocor, dan sejauh apa rencana respons insidennya?

**Keputusan:** Kandidat paling fatal: API key seller (menyalahgunakan kuota AI atas nama mereka) dan bukti transfer (data finansial); siapkan satu halaman SOP insiden: identifikasi → rotasi key → notifikasi terdampak → post-mortem.

#### PRD-16-15 — Metrik sukses 6 bulan

**Referensi:** SPEC-16-15.

**Konteks keputusan:** Satu metrik utama apa yang menentukan platform dinyatakan berhasil di 6 bulan pertama?

**Keputusan:** Jumlah transaksi terverifikasi per bulan.

## 7. Kebutuhan pengalaman pengguna dan batas teknologi

### 7.1. Sembilan kriteria wajib tambahan

Disalin dari instruksi eksplisit pengguna pada permintaan DESIGN.md. Kriteria ini berlaku bersama brainstorming; tidak bergantung pada lampiran teknis khusus desain.

1. Font: Plus Jakarta Sans di seluruh platform.
2. Icon: hanya dari Lucide Icon Library (via CDN). Jangan pernah menggunakan icon emoji, dalam bentuk apa pun.
3. Elemen kustom dengan animasi smooth: custom WebKit scrollbar, custom dropdown, custom checkbox, dan elemen form/UI kustom lainnya — semua dengan transisi/animasi halus, bukan default browser.
4. Accessibility wajib mengikuti standar WCAG di seluruh komponen.
5. Smooth scroll menggunakan Lenis.
6. Responsive design penuh untuk tiga breakpoint: Desktop, Tablet, dan Mobile.
7. Tech stack: Next.js (App Router) sebagai frontend SEKALIGUS backend (API Routes) — satu framework full-stack, bukan React Router terpisah sebagai layer backend. NeonDB Postgres sebagai database, Supabase sebagai storage, Vercel sebagai platform deployment tunggal.
8. Animasi entrance dan exit menggunakan Framer Motion.
9. Gaya visual card (product card, dashboard card, dll) menggunakan Liquid Glass / Glassmorphism style.

### 7.2. Batas nonfungsional yang sudah dipilih

| Area                | Kebutuhan yang sudah tercatat                                                                        | Referensi    |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| Data                | Neon untuk seluruh data relasional; Supabase Storage untuk file biner.                               | PRD-15-01    |
| ORM                 | Prisma.                                                                                              | PRD-15-02    |
| Keamanan route      | Zod, cek session di route, ownership, error tidak membocorkan stack.                                 | PRD-15-04    |
| Rate limit          | Upstash Redis REST, sliding window per-IP+user pada login, upload bukti, submit order.               | PRD-15-03    |
| BYOK                | AES-256-GCM at-rest dengan key environment Vercel, test saat disimpan, tampilan ter-mask dan rotasi. | PRD-07-08–09 |
| Bukti lolos         | WebP di bucket private; signed URL singkat dari API.                                                 | PRD-07-06    |
| Monitoring          | JSON log di Vercel Logs dan alert kritis melalui Nodemailer.                                         | PRD-15-05    |
| Backup              | PITR Neon, `pg_dump` bulanan via GitHub Actions ke storage pribadi, uji restore berkala.             | PRD-15-06    |
| Pergantian provider | Interface tunggal untuk delivery dan AI scanner, digunakan saat diperlukan.                          | PRD-16-04    |
| Insiden             | Identifikasi, rotasi key, notifikasi terdampak dan post-mortem.                                      | PRD-16-14    |

### 7.3. Detail yang belum menjadi persyaratan numerik

- Nilai HEX brand, spacing, radius dan batas piksel breakpoint belum ditemukan dalam sumber/riwayat relevan yang tersedia. Arahan warna tetap navy-ke-biru terang + hitam, mengacu pada logo; nilai numeriknya **[BELUM DIPUTUSKAN — perlu klarifikasi]**.
- Versi/level WCAG, parameter Glassmorphism/motion, detail kontrol kustom, endpoint/versi CDN Lucide dan representasi icon sosial: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.
- Target latensi, uptime, kapasitas, anggaran, RPO/RTO, frekuensi uji restore dan nilai rate limit: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.
- Schema database, kontrak API/interface, nama environment variable, provider/model AI, SMTP/screenshot, scheduler selain backup bulanan, dan library auth: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.
- Detail visual khusus lampiran tidak disalin ke PRD. Dokumentasinya tetap berada dalam DESIGN.md.

## 8. Kriteria penerimaan berdasarkan keputusan sumber

Kriteria di bawah adalah skenario pemeriksaan, bukan hasil pengujian yang telah dijalankan. Pemilihan framework tes, penanggung jawab UAT dan mekanisme rilis belum ditetapkan. Semua kebutuhan pada bagian 3, 6 dan 7 tetap berlaku meskipun tidak mempunyai baris skenario tersendiri di tabel ini.

### 8.1. Identitas, akun dan toko

| ID    | Kondisi yang diperiksa                                                 | Hasil yang harus sesuai sumber                                                                                                         | Referensi               |
| ----- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| AC-01 | Buyer membuka checkout tanpa akun atau tanpa verifikasi email pertama. | Akun diperlukan sebelum checkout; verifikasi email diwajibkan sebelum checkout pertama; katalog tetap dapat dilihat tanpa verifikasi.  | PRD-04-01; PRD-05-02    |
| AC-02 | User memakai reset password.                                           | Link sekali-pakai kedaluwarsa satu jam; token ter-hash; seluruh session lama diturunkan setelah reset.                                 | PRD-05-03               |
| AC-03 | User login dengan/tanpa Ingat saya.                                    | Masa session masing-masing 30 hari/1 hari; logout tersedia.                                                                            | PRD-05-07               |
| AC-04 | Buyer menjalani onboarding seller.                                     | Tidak membutuhkan approval manusia untuk menjadi seller; satu akun satu toko; slug tidak dapat diganti setelah toko dibuat.            | PRD-05-04–05; PRD-02-01 |
| AC-05 | Seller melewati API key dan meninggalkan onboarding di tengah.         | Konsekuensi semua order manual dinyatakan; key bisa diisi belakangan; langkah tersimpan sebagai draft dan checklist dapat dilanjutkan. | PRD-06-03; PRD-06-05    |
| AC-06 | Toko belum memiliki produk terverifikasi.                              | Toko berstatus Disiapkan dan hanya terlihat oleh pemilik. Hubungan layar selesai onboarding mengikuti gap yang masih terbuka.          | PRD-06-04; GAP-08       |

### 8.2. Penemuan produk dan pengelolaan katalog

| ID    | Kondisi yang diperiksa                                 | Hasil yang harus sesuai sumber                                                                                             | Referensi             |
| ----- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| AC-07 | Buyer menerapkan filter dan berpindah halaman katalog. | Filter tersimpan dalam URL; back browser berfungsi; pagination 24 produk per halaman dengan nomor halaman dan URL berubah. | PRD-03-02; PRD-03-05  |
| AC-08 | Buyer melakukan pencarian dan tidak mendapat hasil.    | Mencari judul, deskripsi, nama toko; debounce 300ms; tiga chip kategori populer tersedia saat tidak ada hasil.             | PRD-03-04             |
| AC-09 | Katalog ditampilkan pada tiga kategori perangkat.      | Grid 3 kolom desktop, 2 tablet, 1 mobile; isi card sesuai sumber dan gaya Glassmorphism sesuai instruksi tambahan.         | PRD-03-01; bagian 7.1 |
| AC-10 | Seller mengubah harga saat ada order berjalan.         | Order baru memakai harga baru; Menunggu Verifikasi/Booked tetap mengunci harga lama.                                       | PRD-02-10             |
| AC-11 | Seller mengarsipkan lalu meng-unarchive produk.        | Arsip hilang dari katalog/pencarian; order/statistik lama tetap ada; unarchive kembali ke draft.                           | PRD-02-09             |

### 8.3. Pembayaran dan verifikasi

| ID    | Kondisi yang diperiksa                                                        | Hasil yang harus sesuai sumber                                                                                                                                             | Referensi                    |
| ----- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| AC-12 | Buyer mengunggah bukti.                                                       | Satu JPG/PNG/HEIC per percobaan, maksimum 5 MB, preview sebelum submit, client menolak bukan gambar valid.                                                                 | PRD-04-04                    |
| AC-13 | Nominal bukti kurang atau lebih dari harga tipe jual.                         | Kurang ditolak otomatis; lebih ditandai untuk review manual dan menghubungi seller. Nominal persis sama tetap mengikuti pemeriksaan lainnya, bukan jaminan otomatis lolos. | PRD-07-01–05                 |
| AC-14 | Bukti bertimestamp sebelum sesi order, duplikat, atau dicurigai dimanipulasi. | Bukti lama/duplikat ditolak menurut aturan sumber; dugaan manipulasi masuk review manual dengan area ditandai.                                                             | PRD-07-02, PRD-07-04–05      |
| AC-15 | Seller mencoba approve manual.                                                | Ketiga checklist wajib dicentang sebelum Approve aktif.                                                                                                                    | PRD-02-06                    |
| AC-16 | Seller tidak merespons order manual.                                          | Setelah 24 jam otomatis batal, email penjelasan buyer dan peringatan kinerja pertama seller; titik mulai tenggat belum dirinci.                                            | PRD-02-07; GAP-11            |
| AC-17 | Primary dan fallback sama-sama gagal.                                         | Antrian Perlu Tindakan, email instruksi WA/ID order dan tombol WA tersedia. Makna Booked/lock tidak dinyatakan lulus sebelum diselaraskan.                                 | PRD-07-10; PRD-04-03; GAP-01 |
| AC-18 | Key baru disimpan/diganti.                                                    | Test murah, enkripsi at-rest dan tampilan ter-mask; key lama langsung nonaktif; tiga kegagalan berturut-turut memicu pengingat rotasi.                                     | PRD-07-08–09                 |

### 8.4. Produk, komisi dan delivery

| ID    | Kondisi yang diperiksa                                | Hasil yang harus sesuai sumber                                                                                                                                                                   | Referensi                               |
| ----- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| AC-19 | Drive 404/private atau live demo merespons HTTP ≥500. | Reject otomatis dengan email alasan serta Perbaiki & Kirim Ulang, sesuai tipe yang memerlukan live demo.                                                                                         | PRD-08-02; Konteks Terkunci             |
| AC-20 | AI mengusulkan approve/reject melalui MCP.            | Usulan beserta alasan; eksekusi final menunggu satu klik Super-Admin; panggilan/aksi dicatat sesuai audit.                                                                                       | PRD-08-04–06                            |
| AC-21 | Order diverifikasi atau dibatalkan/kedaluwarsa.       | Komisi dicatat hanya untuk transaksi terverifikasi dalam ledger per event; batal/kedaluwarsa tidak masuk Commission Owed.                                                                        | PRD-09-05                               |
| AC-22 | Super-Admin mengubah nominal komisi.                  | Perubahan hanya berlaku pada transaksi baru dan tidak mengubah snapshot/Commission Owed lama. Titik snapshot mengikuti gap terbuka.                                                              | PRD-01-05; GAP-16                       |
| AC-23 | Bukti pembayaran komisi diperiksa.                    | Pemeriksaan manual tanpa AI; form memuat invoice, nominal, tanggal, metode, referensi opsional; setelah disimpan invoice Lunas dan counter reset. Hubungan reset siklus tetap perlu klarifikasi. | Konteks Terkunci; PRD-09-06; GAP-09     |
| AC-24 | Buyer mengakses file dan koleksi.                     | Koleksi permanen untuk order Lunas; hanya satu kali download tanpa kecuali/reset. Transport dan titik konsumsi kuota belum dapat diuji final.                                                    | PRD-11-02–03, PRD-11-06; GAP-02, GAP-13 |
| AC-25 | Link produk aktif mati atau diganti seller.           | Re-inspeksi mingguan; link mati di-unlist dengan tenggat 72 jam; ganti link memicu verifikasi ulang dan hitung ulang hash sebelum aktif kembali.                                                 | PRD-11-01; PRD-11-05                    |

### 8.5. Trust & Safety, generator dan kualitas lintas platform

| ID    | Kondisi yang diperiksa                                 | Hasil yang harus sesuai sumber                                                                                                                                | Referensi                              |
| ----- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| AC-26 | Buyer menulis/mengedit review dan seller merespons.    | Order Lunas diperlukan; satu review per pembelian; edit tujuh hari pertama; seller satu balasan publik dan tidak dapat menghapus.                             | PRD-10-05–06                           |
| AC-27 | Refund atau klarifikasi isi diajukan.                  | Dasar refund mengikuti sumber; bukan karena selera; seller memberi bukti isi dalam 48 jam; hasil mediasi/refund manual di luar sistem.                        | PRD-10-04; PRD-16-02; Konteks Terkunci |
| AC-28 | Transaksi ditandai self-buy.                           | Sinyal IP/device sama ditandai; self-buy tidak dihitung ke terlaris dan rating diflag untuk review.                                                           | PRD-16-12                              |
| AC-29 | User menggunakan Prompt Generator.                     | Tujuh blok, reorder vertikal menentukan urutan prompt, ekspor Markdown/plain text/JSON; guest terbatas, akun ekspor penuh sesuai batas yang nanti diperjelas. | PRD-12-01, PRD-12-03–05; GAP-15        |
| AC-30 | Buyer membuka Coba di Generator pada Prompt saja.      | Struktur tampil sebagai template read-only; isi tersembunyi sampai pembelian selesai.                                                                         | PRD-12-06                              |
| AC-31 | Super-Admin mengekspor analytics dengan filter aktif.  | CSV per tabel transaksi/komisi/seller menerapkan seluruh filter aktif.                                                                                        | PRD-01-04                              |
| AC-32 | Komponen UI diperiksa lintas tema/perangkat.           | Kesembilan kriteria pada bagian 7.1 diterapkan; tidak memakai emoji; WCAG wajib, tetapi versi/level dan token numerik belum ditetapkan.                       | Bagian 7.1–7.3                         |
| AC-33 | Endpoint sensitif dan ownership diperiksa.             | Rate limit per-IP+user; validasi Zod, session di route, ownership dan error tanpa stack. Nilai limit dan kontrak rinci masih terbuka.                         | PRD-15-03–04                           |
| AC-34 | Laporan inspeksi/audit dan file bukti lolos diperiksa. | Laporan memuat struktur tetap; audit memuat aktor/waktu/payload/hasil/alasan; bukti lolos private melalui signed URL singkat.                                 | PRD-08-01, PRD-08-06; PRD-07-06        |

### 8.6. Pemeriksaan yang belum dapat difinalkan

Penerimaan perilaku terkait Booked/lock, redirect delivery, suspend komisi, reset siklus, cakupan notifikasi update, akses data transaksi, serta hubungan aturan moderasi/onboarding masih memerlukan klarifikasi. Untuk retensi bukti, penghapusan 30 hari dan klausul maksimum 90 hari perlu diselaraskan tanpa menganggap otomatis saling menggantikan.

Tidak ada baris kriteria yang memberi pengecualian baru terhadap keputusan sumber. Status “lulus”, hasil UAT, tanggal peluncuran dan pihak pemberi persetujuan rilis: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.

## 9. Dependensi dan risiko yang sudah tercatat

| Dependensi/risiko                    | Respons yang dipilih sumber                                                                     | Rujukan                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------ |
| Google Drive dan penyedia AI         | Interface tunggal delivery/scanner untuk pergantian provider saat benar-benar diperlukan.       | PRD-16-04                      |
| Key AI gagal                         | Fallback/manual, WA, antrian seller dan pengingat rotasi.                                       | Konteks Terkunci; PRD-07-09–10 |
| Link produk mati pasca-jual          | Re-inspeksi, unlist, tenggat perbaikan 72 jam.                                                  | PRD-11-01                      |
| Konsentrasi katalog pada satu seller | Metrik konsentrasi top-1 sebagai sinyal rekrutmen, tanpa pembatasan eksplisit seller produktif. | PRD-16-03                      |
| Super-Admin tunggal tidak tersedia   | Risiko platform berhenti total diterima.                                                        | PRD-16-13                      |
| API key/bukti transfer bocor         | SOP identifikasi, rotasi, notifikasi terdampak, post-mortem.                                    | PRD-16-14                      |
| Batas serverless untuk browser penuh | Fetch HTTP, API screenshot free-tier, browser penuh lokal bila perlu.                           | PRD-15-07                      |
| Kehilangan database                  | PITR Neon, backup bulanan dan uji restore berkala.                                              | PRD-15-06                      |

Tidak ada probabilitas, skor risiko, biaya, jadwal, atau mitigasi baru yang ditetapkan. Nama provider yang belum dipilih dan rincian respons yang belum tersedia tetap gap.

## 10. Konflik dan celah keputusan

Daftar di bawah dibawa dari SPEC.md agar kebutuhan terbuka tetap terlihat. Penanda gap tidak mengganti keputusan yang sudah dikutip. Tambahan kriteria desain sudah berlaku; detail numeriknya masih belum tersedia.

### 10.1. Keputusan yang memerlukan penyelarasan

| ID     | Referensi sumber                                           | Hal yang perlu diperjelas                                                                                                                                                                                                                                                    | Status                                 |
| ------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| GAP-01 | SPEC-03-07, SPEC-04-02, SPEC-07-10; Konteks Terkunci       | Booked dijelaskan sebagai keranjang yang dapat dikeluarkan buyer kapan saja; produk dapat dibeli paralel; tetapi kegagalan kedua key menyebut lock produk maksimal 24 jam. Perlu kejelasan objek lock, hubungan keranjang dengan order, serta arti Booked pada setiap jalur. | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-02 | SPEC-04-05, SPEC-11-02                                     | Checkout mensyaratkan download tanpa redirect ke Google Drive, sedangkan Delivery File menetapkan respons 302 ke link Drive. Mekanisme delivery final belum dapat dipilih tanpa menyelaraskan kedua keputusan.                                                               | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-03 | SPEC-01-06, SPEC-09-02, SPEC-09-04                         | Settings menetapkan suspend otomatis saat batas tunggakan terlewati; penagihan menetapkan grace period 7 hari dan suspend hari ke-8 setelah invoice terbit. Perlu kejelasan hubungan batas suspend, threshold invoice, dan waktu eksekusi suspend.                           | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-04 | SPEC-07-07, SPEC-14-01                                     | Scanner menetapkan penghapusan file bukti setelah 30 hari; klausul privasi menyebut maksimal 90 hari. Perlu konfirmasi hubungan kedua durasi agar teks legal dan job penghapusan konsisten; batas maksimal 90 hari tidak otomatis mengganti retensi 30 hari.                 | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-05 | SPEC-11-04, SPEC-13-02                                     | Pembaruan file dilakukan tanpa notifikasi kepada buyer lama, tetapi notification center mencakup update produk yang dibeli. Perlu penentuan cakupan event update produk yang menghasilkan notifikasi.                                                                        | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-06 | SPEC-14-02, SPEC-02-05, SPEC-02-08, SPEC-04-06, SPEC-06-02 | Klausul data transaksi membatasi akses hanya Super-Admin, sedangkan seller mengelola QR dan melihat transaksi/revenue, serta buyer menerima QR dan instruksi bayar. Perlu batas akses per jenis data dan aktor yang dimaksud klausul legal.                                  | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-07 | SPEC-10-01, SPEC-16-09; Konteks Terkunci                   | Moderasi menetapkan review deskripsi, preview, dan harga untuk konten ilegal/menyesatkan; keputusan kualitas menyebut semua prompt dengan link hidup boleh dijual. Perlu kejelasan penerapan syarat publikasi tanpa menambahkan penilaian kualitas prompt.                   | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-08 | SPEC-06-01, SPEC-06-04, SPEC-06-06                         | Langkah onboarding keempat sudah mencakup pengiriman produk untuk verifikasi, sedangkan layar selesai kembali meminta pengiriman produk pertama dan menyatakan toko siap. Perlu kejelasan kondisi layar selesai terhadap status Disiapkan dan produk terverifikasi.          | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-09 | Konteks Terkunci, SPEC-09-06                               | Konteks menyebut invoice terbit saat threshold tercapai lalu siklus reset; verifikasi komisi menetapkan counter reset setelah invoice Lunas. Perlu kejelasan counter/siklus yang dimaksud dan perlakuan transaksi baru selama invoice belum dilunasi.                        | [BELUM DIPUTUSKAN — perlu klarifikasi] |

### 10.2. Rincian yang belum tersedia dalam sumber

| ID     | Area dan referensi                                                                                   | Rincian yang belum ditetapkan                                                                                                                                                                                                                                                                                       | Status                                 |
| ------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| GAP-10 | Landing Page dan Documentation Page — Konteks Terkunci                                               | Sumber menyatakan 9 section landing dan 12 section dokumentasi sudah selesai dibrainstorm, tetapi daftar, urutan, isi, dan perilaku tiap section tidak disertakan pada bagian brainstorming yang tersedia. Detailnya tidak boleh direkonstruksi dari lampiran DESIGN.md.                                            | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-11 | Siklus order — SPEC-02-07, SPEC-04-02, SPEC-04-05, SPEC-04-08, SPEC-07-02, SPEC-07-10, SPEC-09-01    | Batas kedaluwarsa sesi pembayaran biasa; seluruh transisi status beserta pemicunya; titik mulai tenggat 24 jam; akibat mengeluarkan Booked dari keranjang terhadap order dan bukti yang sudah dikirim. Timeline yang ditulis sumber tidak cukup untuk menetapkan seluruh transisi.                                  | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-12 | Verifikasi pembayaran — Konteks Terkunci, SPEC-07-01, SPEC-07-04, SPEC-07-05, SPEC-07-08, SPEC-07-10 | Provider/model AI yang didukung, timeout dan retry, parameter pencocokan perceptual hash, data hasil scanner yang boleh disimpan, penyimpanan sementara bukti menunggu/ditolak, serta cara menilai bukti susulan untuk kurang bayar tanpa mengubah aturan nominal persis sama.                                      | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-13 | Download dan koleksi — SPEC-11-02, SPEC-11-03, SPEC-11-06                                            | Definisi teknis satu kali download (kapan kuota dianggap terpakai), penanganan unduhan terputus, serta tampilan tombol koleksi setelah kuota habis. Batas tetap satu kali tanpa kecuali dan tanpa reset; koleksi permanen tidak menetapkan hak unduh tambahan.                                                      | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-14 | Produk dan katalog — Konteks Terkunci, SPEC-03-02, SPEC-03-03, SPEC-03-04, SPEC-03-06                | Daftar kategori selain Website, penerapan tipe jual pada kategori lain, nilai chip rentang harga, nilai filter rating, batas/format preview dan ZIP, pemetaan file per tipe jual, penentuan kategori populer dan produk serupa, serta rumus lengkap Terlaris minggu ini.                                            | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-15 | Prompt Generator — SPEC-12-01, SPEC-12-05, SPEC-12-06                                                | Batas ekspor untuk guest, nama key/skema JSON, sumber struktur blok dari produk ZIP, perilaku template setelah pembelian, serta penyimpanan hasil canvas.                                                                                                                                                           | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-16 | Komisi dan invoice — SPEC-01-05, SPEC-09-04, SPEC-09-06, SPEC-16-05, SPEC-16-08                      | Perlakuan komisi untuk prompt gratis, pembayaran komisi kurang/lebih dari invoice, komisi saat refund, pemulihan toko setelah pembayaran, dan definisi saat snapshot nominal komisi diambil pada order yang belum terverifikasi ketika setting berubah. Tidak ada pengecualian komisi baru yang ditetapkan di sini. | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-17 | Auth, akun, dan otorisasi — SPEC-05-01, SPEC-05-06, SPEC-05-07; Konteks Terkunci                     | Library auth, identitas hardcoded Super-Admin, hubungan akun Google dengan email/password, validasi slug, serta proses setelah masa tenggang soft-delete dan dampaknya pada toko, order, serta kewajiban komisi.                                                                                                    | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-18 | Legal dan dispute — SPEC-10-04, SPEC-14-01, SPEC-14-02, SPEC-14-06, SPEC-16-02                       | Kota domisili hukum, naskah lengkap ToS/Privacy Policy, cakupan salinan hasil proses AI yang tidak disimpan, batas waktu pengajuan dispute, dan detail pencatatan hasil refund manual.                                                                                                                              | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-19 | Infrastruktur dan keamanan — SPEC-07-06, SPEC-08-04, SPEC-15-03, SPEC-15-06, SPEC-15-07              | Penyedia API screenshot, scheduler untuk job selain backup bulanan yang sudah disebut, durasi signed URL, angka rate limit, storage pribadi untuk backup, frekuensi uji restore, serta mekanisme akses MCP ber-secret-token yang juga disebut tidak diekspos publik.                                                | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-20 | Kontrak implementasi — SPEC-15-01, SPEC-15-02, SPEC-15-04, SPEC-16-04                                | Skema database lengkap, seluruh kontrak API, kode error, nama environment variable, versi dependency, dan bentuk interface modul delivery/scanner. Teknologi yang sudah dipilih tetap berlaku; detail tersebut belum ditentukan oleh sumber.                                                                        | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-21 | Metrik, moderasi, dan operasional — SPEC-16-01, SPEC-16-03, SPEC-16-12, SPEC-16-14, SPEC-16-15       | Algoritme deteksi plagiarisme internal, metode fingerprint perangkat, rumus konsentrasi top-1 seller, target angka transaksi bulanan, isi rinci SOP insiden, dan target performa/ketersediaan. Penerimaan risiko Super-Admin tidak tersedia tetap mengikuti SPEC-16-13.                                             | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-22 | Fase kedua dan akuisisi — SPEC-16-06, SPEC-16-07                                                     | Nominal harga tetap featured listing serta hubungan fitur fase kedua dengan penawaran featured listing gratis 30 hari untuk seller awal.                                                                                                                                                                            | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| GAP-23 | Detail visual — Konteks Terkunci, SPEC-02-02, SPEC-03-01                                             | Nilai delapan preset aksen, breakpoint pasti, spacing scale, serta spesifikasi komponen UI yang tidak disebut sumber. Grid 3/2/1 kolom dan keputusan visual eksplisit tetap dipertahankan. Detail aset dan konfigurasi GradientASCII dibahas hanya di DESIGN.md.                                                    | [BELUM DIPUTUSKAN — perlu klarifikasi] |

### 10.3. Tambahan dari instruksi desain terbaru

- Kebutuhan umum font, Lucide via CDN, kontrol kustom, WCAG, Lenis, responsive Desktop/Tablet/Mobile, full-stack Next.js, Framer Motion, dan Glassmorphism sudah diputuskan; tidak dikembalikan menjadi pertanyaan terbuka.
- Nilai token dan detail interaksi yang tidak disebut masih **[BELUM DIPUTUSKAN — perlu klarifikasi]**.
- Representasi ikon sosial resmi dalam batas “hanya Lucide” belum ditentukan; tidak ditambahkan library icon lain.
- Lampiran teknis tetap khusus DESIGN.md dan tidak dipakai untuk mengisi daftar section, token ataupun kebutuhan lain dalam PRD.

## 11. Batas kelengkapan dan kelanjutan

1. PRD mencakup Konteks Terkunci, seluruh 120 jawaban, sembilan kriteria tambahan, kebutuhan per peran, cakupan fase, metrik dan skenario penerimaan yang diturunkan dari keputusan tersebut.
2. Tidak ada keputusan bahwa seluruh gap telah selesai atau implementasi siap dirilis. Detail yang belum tersedia tetap ditandai, termasuk tanggal rilis, estimasi, penanggung jawab dan prioritas pembangunan.
3. Ketika ada klarifikasi pengguna, kebutuhan dan kriteria terkait perlu mengikuti keputusan eksplisit tersebut; dokumen ini tidak menebak jawabannya terlebih dahulu.
4. SPEC.md, ARCHITECTURE.md, DESIGN.md, dan CONTEXT.md adalah dokumen yang telah disusun sebelumnya. PRD.md adalah dokumen kelima pada tahap ini.
5. Dokumen berikutnya adalah **PROMPT.md**, prompt handoff untuk chat.z.ai. Penyusunannya menunggu perintah lanjut pengguna; WORKFLOW.md tetap disusun sesudahnya sesuai urutan.
