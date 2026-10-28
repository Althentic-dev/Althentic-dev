# SPEC.md — Spesifikasi Project Althentic.Dev

**Sumber:** `althentic-brainstorm-result-final.md` — Konteks Terkunci dan 120 Q&A, ekspor 2026-10-27 09:49 WIB.
**Cakupan:** Spesifikasi perilaku, aturan bisnis, batasan teknis, keamanan, operasional, dan keputusan fase lanjutan yang tercatat dalam sumber.
**Status:** Keputusan sumber dipertahankan; konflik dan rincian yang belum tersedia dicatat terpisah sebagai kebutuhan klarifikasi.

## Aturan pembacaan

1. Setiap butir `SPEC-xx-yy` mengacu pada section `xx`, pertanyaan ke-`yy` dalam brainstorming. ID tersebut hanya penanda dokumentasi, bukan ID database atau nama API.
2. Teks setelah **Keputusan:** disalin persis dari jawaban sumber. Pertanyaan asal dipertahankan sebagai konteks agar jawaban tidak kehilangan cakupannya. Penanda “(Ketik sendiri)” merupakan bagian dari sumber.
3. Konteks Terkunci juga disalin persis. Judul butir diambil dari tabel Ringkasan Keputusan Final.
4. Bagian “Konflik dan celah spesifikasi” adalah catatan keterbatasan sumber, bukan keputusan pengganti. Tidak ada prioritas antarjawaban yang ditetapkan sendiri.
5. Lampiran kode `GradientASCII` dan aset isometric block cluster tidak digunakan dalam SPEC.md; keduanya hanya menjadi referensi DESIGN.md.
6. Fitur yang sumbernya menyebut fase kedua, “nanti”, atau ditunda tetap mengikuti batas waktu tersebut. Keberadaannya dalam spesifikasi tidak mengubahnya menjadi kebutuhan peluncuran awal.

## Konteks Terkunci

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

## Indeks spesifikasi

| Bagian sumber | Cakupan                                               | ID keputusan               |
| ------------- | ----------------------------------------------------- | -------------------------- |
| 1             | Dashboard Super-Admin — Analytics Platform & Settings | SPEC-01-01 s.d. SPEC-01-07 |
| 2             | Dashboard Admin/Seller                                | SPEC-02-01 s.d. SPEC-02-10 |
| 3             | Katalog & Detail Produk                               | SPEC-03-01 s.d. SPEC-03-08 |
| 4             | Alur Checkout & Pembayaran                            | SPEC-04-01 s.d. SPEC-04-08 |
| 5             | Auth & Akun                                           | SPEC-05-01 s.d. SPEC-05-07 |
| 6             | Onboarding Seller                                     | SPEC-06-01 s.d. SPEC-06-06 |
| 7             | AI Receipt Scanner                                    | SPEC-07-01 s.d. SPEC-07-10 |
| 8             | Verifikasi Produk & MCP                               | SPEC-08-01 s.d. SPEC-08-06 |
| 9             | Komisi & Penagihan                                    | SPEC-09-01 s.d. SPEC-09-06 |
| 10            | Trust & Safety                                        | SPEC-10-01 s.d. SPEC-10-07 |
| 11            | Delivery File                                         | SPEC-11-01 s.d. SPEC-11-06 |
| 12            | Prompt Generator (Gaya M3E Canvas)                    | SPEC-12-01 s.d. SPEC-12-06 |
| 13            | Halaman Tambahan                                      | SPEC-13-01 s.d. SPEC-13-05 |
| 14            | Legal                                                 | SPEC-14-01 s.d. SPEC-14-06 |
| 15            | Teknis & Infrastruktur                                | SPEC-15-01 s.d. SPEC-15-07 |
| 16            | Pertanyaan Gap — Celah yang Belum Terpikirkan         | SPEC-16-01 s.d. SPEC-16-15 |

## 1. Dashboard Super-Admin — Analytics Platform & Settings

### SPEC-01-01 — Periode default Analytics

**Konteks sumber:** Rentang waktu default apa yang ditampilkan saat Super-Admin pertama kali membuka halaman Analytics Platform?

**Keputusan:** “7 hari terakhir” sebagai periode default, dengan tab cepat: Hari ini / 7 hari / 30 hari / 90 hari / Custom.

### SPEC-01-02 — Metrik 4 kartu Analytics

**Konteks sumber:** Empat kartu metrik teratas Analytics Platform (di luar Overview yang sudah ada) harus menampilkan apa?

**Keputusan:** GMV estimasi (nilai transaksi terverifikasi), jumlah transaksi terverifikasi, komisi tertagih vs outstanding, dan rasio seller aktif vs suspend — satu layar langsung menjawab “sehat atau tidaknya marketplace”.

### SPEC-01-03 — Grafik saat data harian kecil

**Konteks sumber:** Bagaimana grafik tren transaksi ditampilkan ketika jumlah transaksi harian masih sangat kecil (0–3 transaksi per hari)?

**Keputusan:** Line chart harian tetap ditampilkan, ditambah garis kedua berupa moving average 7 hari sebagai baseline tren.

### SPEC-01-04 — Ekspor data Analytics

**Konteks sumber:** Fitur ekspor data dari Analytics Platform: format apa yang dipakai dan cakupannya bagaimana?

**Keputusan:** Export CSV per-tabel (transaksi, komisi, seller) dengan semua filter aktif diterapkan ke file yang diunduh.

### SPEC-01-05 — Komisi bisa diubah di Settings

**Konteks sumber:** Nominal komisi flat saat ini Rp1.000. Apakah nilai komisi boleh diubah dari halaman Settings, dan bagaimana perilakunya terhadap transaksi lama?

**Keputusan:** Field “Nominal komisi per transaksi” bisa diedit dari Settings, hanya berlaku untuk transaksi baru; setiap baris order menyimpan snapshot nominal komisi saat transaksi terjadi sehingga “Commission Owed” lama tidak berubah sendiri.

### SPEC-01-06 — Threshold suspend menunggak

**Konteks sumber:** Threshold suspend untuk seller menunggak komisi: berapa nilainya dan perilakunya seperti apa?

**Keputusan:** Setting “Batas tunggakan sebelum suspend” default Rp25.000 (setara 25 transaksi); saat terlewati toko di-suspend otomatis, dengan email peringatan otomatis saat saldo menyentuh 50% dan 80% dari batas.

### SPEC-01-07 — Template WhatsApp fallback

**Konteks sumber:** Template pesan WhatsApp fallback (yang muncul saat AI Receipt Scanner gagal total) dikelola bagaimana di Settings?

**Keputusan:** Textarea template di Settings dengan placeholder {nama_buyer}, {nama_produk}, {jumlah}, {slug_toko}, plus tombol “Uji pratinjau” yang merender contoh pesan.

## 2. Dashboard Admin/Seller

### SPEC-02-01 — Aturan ubah slug toko

**Konteks sumber:** Seller ingin mengubah slug tokonya (misal karena rebranding). Aturan apa yang diterapkan?

**Keputusan:** Slug bersifat permanen dan tidak pernah bisa diubah setelah toko dibuat.

### SPEC-02-02 — Warna aksen branding toko

**Konteks sumber:** Untuk branding toko, seberapa jauh seller boleh mengkustomisasi warna halaman tokonya?

**Keputusan:** Seller memilih 1 warna aksen dari 8 preset terkurasi yang hanya diterapkan pada banner, badge, dan tombol CTA tokonya — tidak menyentuh kerangka UI platform.

### SPEC-02-03 — Spesifikasi banner toko

**Konteks sumber:** Spesifikasi upload banner toko seperti apa yang diterapkan?

**Keputusan:** Satu banner 1600x400 px (rasio 4:1), JPG/PNG maksimal 2 MB, dikonversi otomatis ke .webp, dengan preview tampilan desktop dan mobile sebelum disimpan.

### SPEC-02-04 — Batas & struktur deskripsi toko

**Konteks sumber:** Deskripsi toko: batas panjang dan strukturnya bagaimana?

**Keputusan:** Deskripsi maksimal 500 karakter plain-text, ditambah field terpisah untuk maksimal 3 link sosial media (Instagram, X, TikTok) yang dirender sebagai ikon resmi.

### SPEC-02-05 — Filter default daftar order

**Konteks sumber:** Daftar order di dashboard seller: kolom, urutan, dan filter default apa yang dipakai?

**Keputusan:** Tabel dengan kolom ID order, produk, harga, status (Menunggu Verifikasi / Booked / Lunas / Dibatalkan / Kedaluwarsa), waktu relatif (“2 jam lalu”); filter default “Menunggu Verifikasi + Booked” agar aksi menunggu selalu di atas.

### SPEC-02-06 — Checklist approve manual

**Konteks sumber:** Saat seller menyetujui order secara manual (jalur tanpa API key), konfirmasi apa yang wajib dia lakukan sebelum tombol Approve aktif?

**Keputusan:** Checklist 3 item wajib dicentang: nominal terlihat sesuai, nama/nomor pengirim terbaca di bukti, dan waktu transfer masuk akal dengan rentang order.

### SPEC-02-07 — Batas respons order manual

**Konteks sumber:** Berapa lama seller boleh tidak merespons order manual sebelum sistem mengambil tindakan otomatis?

**Keputusan:** 24 jam tanpa respons: order otomatis batal, buyer menerima email penjelasan dan boleh reorder, seller menerima peringatan kinerja pertama.

### SPEC-02-08 — Metrik utama analytics toko

**Konteks sumber:** Analytics penjualan toko: metrik utama apa yang ditampilkan di halaman tersebut?

**Keputusan:** Empat kartu: transaksi terverifikasi, revenue kotor, Commission Owed berjalan, dan produk terlaris — dilengkapi grafik 30 hari dan tabel 5 produk teratas.

### SPEC-02-09 — Perilaku arsip produk

**Konteks sumber:** Ketika seller mengarsipkan (archive) sebuah produk, apa persisnya yang terjadi?

**Keputusan:** Produk hilang dari katalog dan pencarian, order dan statistik lama tetap tersedia di dashboard, dan produk bisa di-unarchive kapan saja ke status draft.

### SPEC-02-10 — Ubah harga vs order berjalan

**Konteks sumber:** Seller mengubah harga sebuah produk; bagaimana dampaknya terhadap order yang sedang berjalan?

**Keputusan:** Harga baru hanya berlaku untuk order yang dibuat setelahnya; order berstatus Menunggu Verifikasi atau Booked tetap mengunci harga lama di baris ordernya.

## 3. Katalog & Detail Produk

### SPEC-03-01 — Struktur listing katalog

**Konteks sumber:** Struktur listing katalog utama untuk menampilkan semua produk seperti apa?

**Keputusan:** Grid kartu 3 kolom di desktop (2 tablet, 1 mobile): preview gambar, judul, harga termurah dari tipe jual yang tersedia, badge kategori, rating, dan nama toko.

### SPEC-03-02 — Set & perilaku filter

**Konteks sumber:** Set filter katalog: filter apa saja yang ada dan bagaimana perilakunya?

**Keputusan:** Filter Kategori, Tipe Jual (Template Jadi / Prompt saja / Bundle), Rentang Harga (chip preset), dan Rating Minimum — semuanya tersimpan sebagai URL query sehingga hasil filter bisa di-share dan tombol back browser berfungsi.

### SPEC-03-03 — Sort default katalog

**Konteks sumber:** Sorting default katalog dan daftar pilihan sort yang ditawarkan?

**Keputusan:** Default “Terlaris minggu ini”, dengan opsi: Terbaru, Termurah, Termahal, Rating tertinggi.

### SPEC-03-04 — Perilaku pencarian

**Konteks sumber:** Perilaku minimum kotak pencarian di katalog seperti apa?

**Keputusan:** Mencari di judul produk, deskripsi, dan nama toko; debounce 300ms; state “tidak ada hasil” menampilkan 3 chip kategori populer sebagai saran.

### SPEC-03-05 — Pagination vs infinite scroll

**Konteks sumber:** Pagination atau infinite scroll untuk navigasi katalog?

**Keputusan:** Pagination klasik 24 produk per halaman dengan nomor halaman dan URL yang ikut berganti.

### SPEC-03-06 — Urutan blok halaman detail

**Konteks sumber:** Urutan blok konten di halaman detail produk disusun bagaimana?

**Keputusan:** Preview besar (klik untuk lightbox) → judul, nama toko, rating → pilihan tipe jual A/B/C dengan harga → deskripsi lengkap → info file (ukuran .zip, isi) → review → produk serupa.

### SPEC-03-07 — Tampilan produk Booked

**Konteks sumber:** Bagaimana tampilan produk yang sedang berstatus “Booked” (ada order menunggu verifikasi) di katalog dan halaman detailnya?

**Keputusan:** Produk tetap bisa dibeli buyer lain secara paralel tanpa antrian.

### SPEC-03-08 — Rating di kartu katalog

**Konteks sumber:** Elemen rating seperti apa yang ditampilkan di kartu katalog?

**Keputusan:** Bintang + jumlah review ringkas, contoh “4.8 (23)” — detail ulasan tetap di halaman detail.

## 4. Alur Checkout & Pembayaran

### SPEC-04-01 — Guest checkout vs wajib akun

**Konteks sumber:** Checkout: bolehkah buyer membeli sebagai guest tanpa membuat akun?

**Keputusan:** Wajib punya akun (email + password atau Google) sebelum masuk halaman checkout; registrasi bisa diselesaikan dari halaman produk tanpa kehilangan konteks.

### SPEC-04-02 — Batas waktu Booked

**Konteks sumber:** Berapa batas waktu status “Booked” / “Menunggu Verifikasi” sebelum order kedaluwarsa dan produk dilepas?

**Keputusan:** (Ketik sendiri) Booked disini seperti "Tambahkan ke keranjang" di Shoopee. jadi, buyer bisa mengeluarkan sendiri produk booked kapan saja dari keranjang.

### SPEC-04-03 — Sumber nomor WhatsApp fallback

**Konteks sumber:** Saat kedua AI key gagal dan buyer diarahkan ke WhatsApp seller: dari mana nomor seller berasal dan bagaimana ditampilkan?

**Keputusan:** Nomor WA diambil dari field wajib saat onboarding seller (divalidasi format Indonesia), dirender sebagai tombol “Hubungi via WhatsApp” dengan pesan template berisi ID order dan nama produk.

### SPEC-04-04 — Spesifikasi upload bukti

**Konteks sumber:** Spesifikasi upload bukti transfer oleh buyer: format, ukuran, dan validasinya?

**Keputusan:** Satu gambar per percobaan, format JPG/PNG/HEIC maksimal 5 MB, wajib melalui layar preview sebelum submit, ditolak di sisi client jika bukan gambar valid.

### SPEC-04-05 — Set status order buyer

**Konteks sumber:** Set status order yang dilihat buyer: apa saja dan bagaimana divisualisasikan?

**Keputusan:** (Ketik sendiri) Enam status: Menunggu Pembayaran → Menunggu Verifikasi → Booked (jalur manual) → Lunas (file terbuka) → Dibatalkan → Kedaluwarsa, ditampilkan sebagai timeline stepper dengan timestamp tiap perubahan. seperti yang sudah saya bilang, jangan pernah menampilkan link google drive nya. jadi, link tersebut berada didalam button yang mana button tersebut ketika diklik, file .zip nya akan terdownload tanpa redirect ke google drive

### SPEC-04-06 — Notifikasi email buyer

**Konteks sumber:** Notifikasi email ke buyer dikirim di momen-momen apa saja?

**Keputusan:** Empat email: order dibuat (berisi instruksi bayar + QR), bukti diterima dan sedang diverifikasi, verifikasi berhasil (berisi akses file), verifikasi gagal (berisi alasan dan cara upload ulang).

### SPEC-04-07 — Notifikasi seller

**Konteks sumber:** Notifikasi ke seller untuk order baru dan aksi manual: kanal dan bentuknya?

**Keputusan:** Email untuk semua event order, ditambah badge counter menonjol di dashboard seller untuk order yang menunggu aksi manual.

### SPEC-04-08 — Hak batalkan order

**Konteks sumber:** Kapan buyer boleh membatalkan order yang dia buat?

**Keputusan:** Selama status masih “Menunggu Pembayaran” atau “Menunggu Verifikasi”, buyer bisa batalkan sendiri satu klik; setelah Lunas, hanya lewat jalur dispute.

## 5. Auth & Akun

### SPEC-05-01 — Metode login utama

**Konteks sumber:** Metode login utama yang ditawarkan di halaman masuk?

**Keputusan:** Email + password sebagai jalur utama, dengan tombol “Lanjutkan dengan Google” sebagai alternatif yang setara.

### SPEC-05-02 — Kewajiban verifikasi email

**Konteks sumber:** Verifikasi email: wajib atau tidak, dan di titik apa dipaksa?

**Keputusan:** Wajib verifikasi sebelum checkout pertama, bukan sebelum bisa melihat-lihat katalog; link verifikasi kedaluwarsa dalam 24 jam dan bisa dikirim ulang.

### SPEC-05-03 — Mekanisme reset password

**Konteks sumber:** Mekanisme lupa password seperti apa yang diimplementasikan?

**Keputusan:** Email berisi link reset sekali-pakai yang kedaluwarsa dalam 1 jam; token disimpan ter-hash di database; setelah reset, semua session lama diturunkan.

### SPEC-05-04 — Satu akun banyak toko

**Konteks sumber:** Apakah satu akun boleh memiliki lebih dari satu toko?

**Keputusan:** Satu akun = satu toko untuk fase awal; kebutuhan multi-toko ditunda sampai ada seller nyata yang memintanya.

### SPEC-05-05 — Naik role jadi seller

**Konteks sumber:** Bagaimana seorang buyer menjadi seller? Apa mekanisme kenaikan perannya?

**Keputusan:** Semua akun otomatis berperan buyer; menjadi seller dilakukan lewat onboarding khusus (data toko + QR + API key semi-optional) tanpa approval manusia; kontrol kualitas dilakukan di verifikasi produk.

### SPEC-05-06 — Cakupan settings akun

**Konteks sumber:** Halaman Settings akun minimal mencakup apa saja?

**Keputusan:** Ubah nama, ganti password, ganti email (wajib re-verifikasi), preferensi email notifikasi, dan hapus akun (soft-delete dengan masa tenggang 30 hari).

### SPEC-05-07 — Durasi session login

**Konteks sumber:** Berapa lama sesi login bertahan sebelum user diminta masuk kembali?

**Keputusan:** 30 hari dengan opsi “Ingat saya di perangkat ini” dicentang; tanpa itu 1 hari; logout manual selalu tersedia.

## 6. Onboarding Seller

### SPEC-06-01 — Urutan langkah onboarding

**Konteks sumber:** Urutan langkah onboarding seller disusun bagaimana?

**Keputusan:** Empat langkah berurutan: (1) profil toko (nama, slug, deskripsi), (2) unggah QR pembayaran, (3) API key AI semi-optional dengan penjelasan konsekuensi, (4) tambah produk pertama dan kirim verifikasi.

### SPEC-06-02 — Validasi setup QR

**Konteks sumber:** Saat seller mengunggah QR pembayaran, validasi apa yang dilakukan sistem?

**Keputusan:** Wajib gambar JPG/PNG maksimal 2 MB dengan preview besar, plus checkbox pernyataan “Saya sudah menguji scan QR ini dan nominalnya masuk ke rekening saya”.

### SPEC-06-03 — Seller skip API key

**Konteks sumber:** Bagaimana menyikapi seller yang menekan “Lewati” pada langkah setup API key AI?

**Keputusan:** Lewati diperbolehkan dengan konsekuensi yang ditulis eksplisit di layar (“Semua order harus Anda approve manual”), dan langkah ini bisa diisi belakangan di Settings toko.

### SPEC-06-04 — Minimum sebelum toko live

**Konteks sumber:** Kapan tepatnya sebuah toko baru dianggap “live” dan tampil untuk publik?

**Keputusan:** Setelah memiliki minimal 1 produk berstatus terverifikasi (lolos inspeksi); sebelum itu toko berstatus “Disiapkan” yang hanya terlihat oleh pemiliknya.

### SPEC-06-05 — Draft onboarding tersimpan

**Konteks sumber:** Jika seller berhenti di tengah onboarding (misalnya setelah langkah 2), apa yang terjadi pada datanya?

**Keputusan:** Setiap langkah tersimpan otomatis sebagai draft; dashboard menampilkan checklist “Toko Anda X% siap” dengan tombol langsung ke langkah yang belum selesai.

### SPEC-06-06 — Layar sukses onboarding

**Konteks sumber:** Apa yang seller lihat tepat setelah menyelesaikan seluruh onboarding?

**Keputusan:** Halaman “Toko Anda siap” berisi 3 langkah berikutnya: bagikan link toko, kirim produk pertama untuk verifikasi, dan kenali halaman Komisi & Tagihan — dengan status verifikasi yang terlihat realtime.

## 7. AI Receipt Scanner

### SPEC-07-01 — Toleransi nominal pencocokan

**Konteks sumber:** Aturan pencocokan nominal antara bukti transfer dan harga tipe jual yang dipilih: berapa toleransinya?

**Keputusan:** (Ketik sendiri) nominal di bukti harus persis sama; kurang dari itu ditolak otomatis sebagai kurang bayar, lebih dari itu ditandai untuk review manual dan menghubungi seller untuk melaporkan.

### SPEC-07-02 — Toleransi waktu transfer

**Konteks sumber:** Toleransi waktu pada bukti transfer: bagaimana timestamp di bukti dicocokkan dengan sesi order?

**Keputusan:** Bukti harus dibuat dalam jendela sesi order: sejak buyer menekan “Bayar Sekarang” hingga batas kedaluwarsa order; timestamp lebih lama dari itu ditolak.

### SPEC-07-03 — Peran nama pengirim

**Konteks sumber:** Bagaimana nama pengirim di bukti transfer diperlakukan dalam keputusan verifikasi?

**Keputusan:** Nama pengirim dibaca AI dan ditampilkan sebagai informasi pendukung di UI, tapi bukan syarat lolos-gagal yang keras.

### SPEC-07-04 — Deteksi bukti dipakai ulang

**Konteks sumber:** Bagaimana sistem mendeteksi bukti transfer yang dipakai ulang untuk order berbeda?

**Keputusan:** Setiap bukti yang lolos disimpan perceptual hash + file hash-nya; bukti baru yang hash-nya cocok dengan riwayat ditolak otomatis dengan alasan “bukti duplikat”.

### SPEC-07-05 — Deteksi bukti dimanipulasi

**Konteks sumber:** Bagaimana menangani dugaan bukti transfer yang dimanipulasi (nominal diedit di screenshot)?

**Keputusan:** Dua lapis: AI diminta menilai indikasi manipulasi (font tidak konsisten, artefak edit, metadata), dan cross-check logika nominal-format; hasil “curiga” masuk antrian review manual dengan area yang dicurigai ditandai.

### SPEC-07-06 — Lokasi penyimpanan bukti .webp

**Konteks sumber:** Di mana dan bagaimana file bukti .webp disimpan setelah lolos verifikasi?

**Keputusan:** Supabase Storage bucket private dengan path receipts/{orderId}/{timestamp}.webp; akses hanya lewat signed URL berumur pendek yang diterbitkan API.

### SPEC-07-07 — Retensi & penghapusan bukti

**Konteks sumber:** Berapa lama bukti transfer disimpan dan kapan dihapus?

**Keputusan:** (Ketik sendiri) 30 hari untuk kebutuhan dispute; setelah itu job terjadwal menghapus file fisiknya sementara metadata transaksi tetap di database.

### SPEC-07-08 — Enkripsi & validasi API key

**Konteks sumber:** API key BYOK seller: bagaimana dienkripsi dan divalidasi saat pertama kali disimpan?

**Keputusan:** Dienkripsi at-rest dengan AES-256-GCM memakai key dari environment Vercel, divalidasi dengan satu panggilan test murah saat disimpan, dan hanya pernah ditampilkan ter-mask (mis. AIza...9f2c) setelahnya.

### SPEC-07-09 — Rotasi API key

**Konteks sumber:** Bagaimana mekanisme rotasi (penggantian) API key oleh seller?

**Keputusan:** Seller bisa menekan “Ganti key” kapan saja di Settings toko; key lama langsung nonaktif; jika key gagal 3 kali berturut-turut, sistem mengirim email pengingat untuk rotasi.

### SPEC-07-10 — Prosedur kedua key gagal

**Konteks sumber:** Saat primary dan fallback key sama-sama gagal (selain tombol WhatsApp ke seller), apa yang sistem lakukan di belakang layar?

**Keputusan:** Order masuk antrian “Perlu Tindakan” di dashboard seller, buyer menerima email berisi instruksi kontak WA beserta ID order, dan status Booked memegang lock produk maksimal 24 jam.

## 8. Verifikasi Produk & MCP

### SPEC-08-01 — Struktur laporan inspeksi

**Konteks sumber:** Struktur laporan Markdown hasil skrip inspeksi Node.js berisi apa saja?

**Keputusan:** Struktur tetap: status link Drive (OK / 404 / private), status HTTP live demo + screenshot desktop, ukuran file .zip, hash file, dan timestamp inspeksi.

### SPEC-08-02 — Aturan reject otomatis

**Konteks sumber:** Kondisi apa yang memicu reject otomatis tanpa perlu review manusia?

**Keputusan:** Link Drive mati (404 atau private) ATAU live demo merespons HTTP 500 ke atas: langsung direject dengan email alasan ke seller dan tombol “Perbaiki & Kirim Ulang”.

### SPEC-08-03 — Batas perbaikan produk reject

**Konteks sumber:** Berapa lama seller boleh memperbaiki produk yang berstatus ditolak?

**Keputusan:** 14 hari sebelum produk otomatis masuk arsip, dengan email pengingat otomatis di hari ke-7.

### SPEC-08-04 — Otorisasi MCP server

**Konteks sumber:** MCP server yang dipakai AI untuk verifikasi: bagaimana otorisasi dan keamanannya?

**Keputusan:** Endpoint MCP hanya menerima request dengan secret token dari environment, tidak diekspos publik, dan setiap pemanggilan tercatat di log audit.

### SPEC-08-05 — Batasan aksi AI via MCP

**Konteks sumber:** Seberapa jauh AI (lewat MCP) boleh bertindak dalam keputusan verifikasi produk?

**Keputusan:** AI boleh membaca laporan inspeksi dan data produk, lalu mengusulkan keputusan (approve/reject beserta alasan); eksekusi final tetap menunggu satu klik konfirmasi Super-Admin.

### SPEC-08-06 — Isi audit trail verifikasi

**Konteks sumber:** Apa saja yang dicatat di audit trail setiap kali verifikasi produk terjadi?

**Keputusan:** Setiap aksi tercatat: aktor (sistem otomatis / Super-Admin / AI), timestamp, payload ringkas (produk, laporan), dan hasil keputusan beserta alasannya.

## 9. Komisi & Penagihan

### SPEC-09-01 — Suspend: nasib produk & order

**Konteks sumber:** Ketika toko di-suspend karena menunggak komisi, apa persisnya yang terjadi pada produk dan order yang sedang berjalan?

**Keputusan:** Produk disembunyikan dari katalog; order berstatus Lunas tetap bisa mengakses filenya; order Menunggu Verifikasi/Booked diberi tenggat 24 jam untuk diselesaikan manual oleh seller.

### SPEC-09-02 — Grace period penagihan

**Konteks sumber:** Berapa grace period yang diberikan sebelum suspend menunggak dieksekusi, dan bagaimana ritmenya?

**Keputusan:** 7 hari setelah invoice terbit: email reminder di hari ke-1, ke-3, dan ke-5; suspend otomatis di hari ke-8 bila belum dibayar.

### SPEC-09-03 — Bentuk reminder penagihan

**Konteks sumber:** Bentuk reminder penagihan komisi seperti apa yang dikirim ke seller?

**Keputusan:** Email otomatis (Nodemailer) berisi jumlah tunggakan, cara bayar, batas tanggal suspend, ditambah banner kuning di dashboard seller saat tersisa 3 hari sebelum suspend.

### SPEC-09-04 — Nilai threshold invoice

**Konteks sumber:** Berapa nilai threshold invoice komisi (jumlah Commission Owed yang memicu invoice otomatis)?

**Keputusan:** Rp25.000 (setara 25 transaksi terverifikasi), dapat diubah Super-Admin di Settings.

### SPEC-09-05 — Pencatatan order batal

**Konteks sumber:** Bagaimana transaksi yang dibatalkan atau kedaluwarsa diperlakukan dalam pencatatan komisi?

**Keputusan:** Order batal/kedaluwarsa tidak pernah masuk “Commission Owed”; komisi hanya dicatat saat transaksi terverifikasi, dalam ledger terpisah per event.

### SPEC-09-06 — Data verifikasi bukti komisi

**Konteks sumber:** Ketika Super-Admin memverifikasi bukti pembayaran komisi secara manual, data apa yang dicatat di sistem?

**Keputusan:** Form verifikasi berisi: pilih invoice, nominal diterima, tanggal bayar, metode (transfer/e-wallet), dan referensi opsional; setelah disimpan status invoice menjadi Lunas dan counter reset ke nol.

## 10. Trust & Safety

### SPEC-10-01 — Moderasi pra-publikasi

**Konteks sumber:** Lapisan moderasi apa yang diterapkan pada produk sebelum tampil publik?

**Keputusan:** Dua lapis: verifikasi teknis otomatis (link Drive, live demo) lewat skrip inspeksi, ditambah review singkat Super-Admin atas deskripsi, preview, dan harga untuk menangkap konten ilegal atau menyesatkan.

### SPEC-10-02 — Alur takedown

**Konteks sumber:** Bagaimana alur takedown produk bekerja dan siapa yang bisa memicunya?

**Keputusan:** Super-Admin bisa takedown kapan saja namun wajib mengisi alasan terstruktur; seller menerima email alasan tersebut dan bisa mengajukan banding lewat jalur dispute.

### SPEC-10-03 — Kategori laporan abuse

**Konteks sumber:** Tombol laporkan produk: kategori laporan apa yang dipilih pelapor?

**Keputusan:** Lima kategori tetap: Konten ilegal, Plagiarisme, Isi tidak sesuai deskripsi, Penipuan pembayaran, Lainnya — plus field detail opsional.

### SPEC-10-04 — Kriteria refund buyer

**Konteks sumber:** Kebijakan refund (yang diproses manual Super-Admin sebagai mediator): kapan buyer dianggap layak didukung?

**Keputusan:** Refund didukung bila: file tidak bisa diakses, isi berbeda drastis dari deskripsi, atau seller tidak merespons 48 jam; “tidak cocok selera” bukan dasar refund.

### SPEC-10-05 — Aturan penulisan review

**Konteks sumber:** Siapa yang boleh menulis review, dan apa aturan penulisannya?

**Keputusan:** Hanya buyer dengan order Lunas pada produk tersebut, satu review per pembelian, berisi rating + teks, dan boleh diedit sendiri dalam 7 hari pertama.

### SPEC-10-06 — Penghapusan review

**Konteks sumber:** Bisakah seller menghapus review yang merugikan mereka? Bagaimana review yang melanggar aturan ditangani?

**Keputusan:** Seller tidak bisa menghapus review, hanya bisa membalas satu kali secara publik; review yang melanggar (hujatan, doxing, spam) hanya bisa dihapus Super-Admin dengan alasan tercatat.

### SPEC-10-07 — Tangga sanksi seller

**Konteks sumber:** Bagaimana tangga sanksi untuk seller yang melanggar aturan platform?

**Keputusan:** Empat tingkat eskalasi: peringatan email → suspend listing 7 hari → suspend toko sampai pelanggaran beres → banned permanen dengan pemblokiran email dan pola perangkat.

## 11. Delivery File

### SPEC-11-01 — Link Drive mati pasca-jual

**Konteks sumber:** Bagaimana platform mendeteksi dan merespons link Google Drive yang mati atau dihapus seller SETELAH produk terjual?

**Keputusan:** Re-inspeksi berkala mingguan untuk semua produk aktif; saat link mati, produk otomatis di-unlist, seller diberi tenggat 72 jam untuk memperbaiki sebelum listing disuspend.

### SPEC-11-02 — Perlindungan link delivery

**Konteks sumber:** Bagaimana link Google Drive dilindungi agar tidak bocor ke orang yang belum membeli?

**Keputusan:** Link Drive tidak pernah tampil mentah; buyer mengakses via endpoint redirect /api/download/[orderId] yang memvalidasi session dan status Lunas, baru 302 ke link Drive; setiap akses tercatat di log.

### SPEC-11-03 — Batas jumlah download

**Konteks sumber:** Berapa batas jumlah download file per order oleh buyer?

**Keputusan:** Hanya 1 kali download, tanpa kecuali dan tanpa reset.

### SPEC-11-04 — Update produk untuk buyer lama

**Konteks sumber:** Ketika seller mengupdate isi produk (.zip revisi), bagaimana buyer lama mendapatkan pembaruan?

**Keputusan:** File lama langsung ditimpa tanpa notifikasi ke buyer yang sudah membeli.

### SPEC-11-05 — Ganti link Drive produk

**Konteks sumber:** Jika seller mengganti link Drive sebuah produk (misalnya pindah akun Drive), mekanisme apa yang berjalan?

**Keputusan:** Penggantian link memicu verifikasi ulang singkat (cek link baru hidup dan publik) sebelum produk aktif kembali; hash file dihitung ulang untuk mendeteksi perubahan isi.

### SPEC-11-06 — Bukti kepemilikan buyer

**Konteks sumber:** Di mana buyer melihat bukti kepemilikan atas semua produk yang pernah dia beli (untuk akses ulang jangka panjang)?

**Keputusan:** Halaman “Koleksi Saya” permanen di akun buyer: semua order Lunas dengan tombol download, info versi, dan tanggal beli.

## 12. Prompt Generator (Gaya M3E Canvas)

### SPEC-12-01 — Target pengguna generator

**Konteks sumber:** Prompt Generator ditujukan untuk siapa di peluncuran pertamanya?

**Keputusan:** Publik tanpa login untuk mencoba, dengan ekspor terbatas; akun terdaftar membuka ekspor penuh dan integrasi marketplace.

### SPEC-12-02 — Model harga generator

**Konteks sumber:** Apakah Prompt Generator gratis atau berbayar?

**Keputusan:** Gratis penuh di fase awal sebagai alat akuisisi dan demo kualitas prompt; monetisasi nanti lewat template prompt premium di marketplace.

### SPEC-12-03 — Set komponen blok prompt

**Konteks sumber:** Komponen (blok) apa saja yang tersedia di canvas pembangun prompt?

**Keputusan:** Tujuh blok inti: Peran (Role), Tugas (Task), Konteks, Format Output, Batasan (Constraints), Contoh (Examples), dan Tone/Gaya.

### SPEC-12-04 — Interaksi canvas drag-drop

**Konteks sumber:** Interaksi drag-drop canvas bagaimana diimplementasikan di versi pertama?

**Keputusan:** Kolom vertikal drag-and-reorder dengan drag handle per blok; urutan blok menentukan urutan struktur prompt akhir.

### SPEC-12-05 — Format ekspor prompt

**Konteks sumber:** Format ekspor prompt terstruktur yang disediakan?

**Keputusan:** Tiga format: Markdown terstruktur, plain text siap-tempel ke chat AI, dan JSON dengan tiap blok sebagai key.

### SPEC-12-06 — Integrasi dengan marketplace

**Konteks sumber:** Bagaimana Prompt Generator terintegrasi dengan produk di marketplace?

**Keputusan:** Tombol “Coba di Generator” di halaman detail produk tipe “Prompt saja”; struktur prompt terjual tampil sebagai template read-only di canvas, dengan isi tersembunyi sampai pembelian selesai.

## 13. Halaman Tambahan

### SPEC-13-01 — Isi profil publik toko

**Konteks sumber:** Halaman profil publik toko berisi apa saja dan berada di URL seperti apa?

**Keputusan:** URL /toko/{slug} menampilkan branding, warna aksen, deskripsi, ikon sosial media, statistik publik (jumlah produk, rating rata-rata, tahun bergabung), dan grid produknya.

### SPEC-13-02 — Cakupan notification center

**Konteks sumber:** Notification center in-app mencakup notifikasi apa saja?

**Keputusan:** Ikon lonceng dengan panel berisi: update order, hasil verifikasi produk, tagihan komisi/invoice, dan update produk yang dibeli — lengkap dengan penanda belum-baca dan link ke objek terkait.

### SPEC-13-03 — Isi halaman settings user

**Konteks sumber:** Halaman Settings untuk semua user (buyer maupun seller) berisi preferensi apa?

**Keputusan:** Tema tampilan (Dark/Light/System), bahasa email notifikasi (ID/EN), dan preferensi email promosi yang bisa dimatikan.

### SPEC-13-04 — Gaya halaman 404/error

**Konteks sumber:** Halaman 404 dan error (500) dirancang seperti apa?

**Keputusan:** Mengikuti bahasa visual landing page: hero Gradient ASCII, pesan singkat, dan tiga tautan pemulihan (katalog, produk terlaris, halaman sebelumnya); varian 500 menampilkan “tim sudah diberi tahu”.

### SPEC-13-05 — Perlunya halaman status

**Konteks sumber:** Apakah platform butuh halaman status (status page) di fase awal?

**Keputusan:** Ya, versi sederhana di /status: kesehatan Neon, Supabase Storage, dan endpoint kritis; diperbarui manual saat insiden ditambah halaman statis sehari-hari.

## 14. Legal

### SPEC-14-01 — Klausul AI pihak ketiga

**Konteks sumber:** Bagaimana Privacy Policy menyatakan pemrosesan gambar bukti transfer oleh AI pihak ketiga (Gemini via BYOK seller)?

**Keputusan:** Klausul eksplisit: gambar bukti diproses oleh layanan AI pihak ketiga yang dipilih seller (memakai API key milik seller); data dikirim langsung ke penyedia tersebut; Althentic tidak menyimpan salinan hasil proses; gambar disimpan maksimal 90 hari lalu dihapus.

### SPEC-14-02 — Perlakuan data finansial

**Konteks sumber:** Bagaimana data finansial (QR seller, nominal transaksi, ledger komisi) diperlakukan secara legal?

**Keputusan:** Digolongkan sebagai “data transaksi”: disimpan selama akun aktif ditambah 5 tahun mengikuti kebiasaan pembukuan, dengan akses terbatas hanya Super-Admin.

### SPEC-14-03 — Mekanisme persetujuan ToS

**Konteks sumber:** Mekanisme persetujuan pengguna atas ToS dan Privacy Policy seperti apa?

**Keputusan:** Checkbox wajib saat pendaftaran + banner re-consent saat ada perubahan material (menampilkan ringkasan perubahan); versi dokumen dan tanggal persetujuan dicatat per akun.

### SPEC-14-04 — Posisi pajak platform

**Konteks sumber:** Bagaimana posisi platform terhadap kewajiban pajak atas transaksi seller?

**Keputusan:** Dinyatakan eksplisit: Althentic hanya menarik komisi layanan; seluruh kewajiban pajak atas penjualan menjadi tanggung jawab seller; platform menyediakan ringkasan transaksi tahunan untuk membantu pembukuan.

### SPEC-14-05 — Usia minimum pengguna

**Konteks sumber:** Berapa usia minimum pengguna platform dan bagaimana ditegakkan?

**Keputusan:** Minimal 17 tahun, dinyatakan di ToS dan dikonfirmasi lewat checkbox pernyataan usia saat pendaftaran.

### SPEC-14-06 — Yurisdiksi & hukum

**Konteks sumber:** Hukum dan yurisdiksi mana yang berlaku untuk ToS dan sengketa?

**Keputusan:** Hukum Indonesia dengan domisili hukum di kota domisili pemilik platform; mediasi wajib sebelum litigasi; ToS ditulis dalam bahasa Indonesia dengan ringkasan bahasa Inggris yang tidak mengikat.

## 15. Teknis & Infrastruktur

### SPEC-15-01 — Pembagian Neon vs Supabase

**Konteks sumber:** Bagaimana pembagian tugas yang disiplin antara Neon (database) dan Supabase Storage (file)?

**Keputusan:** Neon menyimpan semua data relasional (users, products, orders, ledger komisi, metadata bukti); Supabase Storage hanya menyimpan file biner (bukti .webp, banner, preview) dalam bucket publik dan private terpisah.

### SPEC-15-02 — Pilihan ORM

**Konteks sumber:** ORM mana yang dipilih untuk berinteraksi dengan Neon Postgres, dan mengapa?

**Keputusan:** Prisma: schema-first, migration tool matang, type generation kuat, dan dokumentasi melimpah — cocok untuk pengembang solo yang harus cepat jalan dengan aman.

### SPEC-15-03 — Strategi rate limiting

**Konteks sumber:** Strategi rate limiting di lingkungan serverless Vercel yang tidak punya memori bersama?

**Keputusan:** Rate limit berbasis Upstash Redis REST (free tier) dengan sliding window per-IP+user pada endpoint sensitif: login, upload bukti, dan submit order.

### SPEC-15-04 — Keamanan API route

**Konteks sumber:** Lapisan keamanan wajib di setiap API route adalah apa saja?

**Keputusan:** Validasi input dengan Zod di setiap route, cek session di dalam route (tidak percaya middleware semata), otorisasi per-ownership (buyer hanya menyentuh order miliknya), dan error response yang tidak membocorkan stack.

### SPEC-15-05 — Logging & monitoring

**Konteks sumber:** Stack logging dan monitoring minimal yang dipakai di fase awal?

**Keputusan:** Structured logging JSON konsisten dilihat lewat Vercel Logs, plus alert email via Nodemailer untuk error kritis (verifikasi gagal massal, koneksi DB gagal).

### SPEC-15-06 — Strategi backup Neon

**Konteks sumber:** Strategi backup untuk database Neon seperti apa?

**Keputusan:** Mengandalkan point-in-time restore bawaan Neon, ditambah pg_dump otomatis bulanan via GitHub Actions terjadwal yang disimpan di storage pribadi — dengan uji restore berkala.

### SPEC-15-07 — Inspeksi Puppeteer di Vercel

**Konteks sumber:** Inspeksi Puppeteer untuk verifikasi produk kena batas serverless Vercel; bagaimana solusinya?

**Keputusan:** Jangan jalankan browser penuh di Vercel: cek status link via fetch HTTP biasa, screenshot via API screenshot free-tier, dan bila perlu browser penuh, jalankan skrip dari mesin lokal Super-Admin lalu unggah laporannya.

## 16. Pertanyaan Gap — Celah yang Belum Terpikirkan

### SPEC-16-01 — Deteksi prompt curian

**Konteks sumber:** Seller bisa menjual prompt yang dicuri dari marketplace lain. Bagaimana lapisan deteksi pertamanya?

**Keputusan:** Deteksi otomatis antar produk di katalog Althentic sendiri saja.

### SPEC-16-02 — Sengketa isi tidak sesuai

**Konteks sumber:** Buyer komplain “isi prompt di dalam .zip tidak sesuai janji” padahal deskripsi terlihat benar. Bagaimana proses klarifikasinya?

**Keputusan:** Seller wajib menunjukkan bukti isi (screenshot terstruktur atau walkthrough singkat) dalam 48 jam lewat dispute; terbukti sesuai: tetap lunas dengan catatan; tidak sesuai: refund manual plus poin sanksi seller.

### SPEC-16-03 — Risiko monokultur seller

**Konteks sumber:** Bagaimana jika satu seller menguasai 80% katalog (risiko monokultur)? Apa sikap platform?

**Keputusan:** Tambahkan metrik “konsentrasi top-1 seller” di dashboard Super-Admin sebagai sinyal untuk mempercepat rekrutmen seller, tanpa pembatasan eksplisit terhadap seller produktif.

### SPEC-16-04 — Ketergantungan pihak ketiga

**Konteks sumber:** Platform bergantung pada Google Drive (delivery) dan Gemini (verifikasi). Apa persiapan bila harga atau kebijakan keduanya berubah drastis?

**Keputusan:** Dokumentasikan abstraksi: modul delivery dan modul AI scanner masing-masing punya satu interface tunggal sehingga bisa ganti provider dengan menyentuh 1–2 file saja; digunakan saat benar-benar dibutuhkan.

### SPEC-16-05 — Komisi vs produk super murah

**Konteks sumber:** Bagaimana nasib komisi Rp1.000 flat ketika ada seller menjual produk super murah, misalnya Rp3.000?

**Keputusan:** Tetap Rp1.000 flat tanpa pengecualian harga.

### SPEC-16-06 — Monetisasi fase kedua

**Konteks sumber:** Selain komisi, monetisasi mana yang paling layak diprioritaskan di fase kedua?

**Keputusan:** Featured listing: produk tampil di posisi teratas katalog/beranda selama 7 hari dengan harga tetap.

### SPEC-16-07 — Rekrutmen 10 seller pertama

**Konteks sumber:** Bagaimana strategi mendapatkan 10 seller pertama (di luar pemilik platform sendiri)?

**Keputusan:** Undangan personal terkurasi: cari 5–10 pembuat prompt yang karyanya sudah bagus di komunitas (X, Discord AI Indonesia), tawarkan onboarding dibantu langsung dan featured listing gratis 30 hari.

### SPEC-16-08 — Strategi 100 buyer pertama

**Konteks sumber:** Bagaimana strategi mendapatkan 100 buyer pertama?

**Keputusan:** Konten dulu: rilis 3–5 prompt gratis berkualitas tinggi dari toko pemilik, dibagikan di komunitas AI dengan CTA menuju marketplace.

### SPEC-16-09 — Penjagaan kualitas prompt

**Konteks sumber:** Bagaimana kualitas isi prompt di katalog dijaga (bukan cuma link yang hidup)?

**Keputusan:** Tidak ada penilaian kualitas; semua prompt yang link-nya hidup boleh dijual.

### SPEC-16-10 — Hak cipta & larangan resell

**Konteks sumber:** Apa batasan lisensi buyer atas prompt yang dibeli? Bolehkah dijual ulang di Althentic?

**Keputusan:** ToS menyatakan: lisensi penggunaan personal dan komersial atas output, dilarang menjual ulang atau mendistribusikan file prompt mentah; pelanggaran berujung banned.

### SPEC-16-11 — Diferensiasi vs kompetitor

**Konteks sumber:** Terhadap kompetitor seperti PromptBase, diferensiasi mana yang dipertahankan mati-matian?

**Keputusan:** Lokalisasi penuh: pembayaran QR lokal tanpa kartu internasional, kurasi dan komunitas berbahasa Indonesia, harga Rupiah.

### SPEC-16-12 — Deteksi self-buying

**Konteks sumber:** Bagaimana mendeteksi seller yang membeli produknya sendiri (akun kedua) untuk memanipulasi rating dan metrik terlaris?

**Keputusan:** Verifikasi transaksi mencocokkan sinyal: akun buyer dengan IP/device fingerprint yang sama dengan seller ditandai; transaksi self-buy tidak dihitung ke metrik terlaris dan ratingnya diflag untuk review.

### SPEC-16-13 — Risiko bus factor Super-Admin

**Konteks sumber:** Jika satu-satunya Super-Admin sakit atau tidak bisa mengakses internet selama 2 minggu, apa yang terjadi pada operasi kritis?

**Keputusan:** Terima risiko platform berhenti total selama itu.

### SPEC-16-14 — Rencana insiden data

**Konteks sumber:** Data apa yang paling fatal jika bocor, dan sejauh apa rencana respons insidennya?

**Keputusan:** Kandidat paling fatal: API key seller (menyalahgunakan kuota AI atas nama mereka) dan bukti transfer (data finansial); siapkan satu halaman SOP insiden: identifikasi → rotasi key → notifikasi terdampak → post-mortem.

### SPEC-16-15 — Metrik sukses 6 bulan

**Konteks sumber:** Satu metrik utama apa yang menentukan platform dinyatakan berhasil di 6 bulan pertama?

**Keputusan:** Jumlah transaksi terverifikasi per bulan.

## 17. Konflik dan celah spesifikasi

Bagian ini tidak mengubah keputusan di atas. Setiap penanda menunjukkan hubungan antaraturan atau rincian yang belum bisa ditetapkan hanya dari dokumen yang tersedia.

### 17.1. Keputusan yang memerlukan penyelarasan

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

### 17.2. Rincian yang belum tersedia dalam sumber

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

## 18. Batas kelengkapan dokumen

1. Seluruh 120 jawaban dan seluruh butir Konteks Terkunci tercakup tanpa perubahan isi keputusan.
2. Daftar konflik dan celah tidak menggantikan keputusan sumber dan tidak memberikan izin untuk memilih asumsi implementasi.
3. Tidak ada rancangan database, kontrak API, SLA, algoritme, detail UI, atau keputusan produk baru yang ditambahkan untuk mengisi celah.
4. ARCHITECTURE.md, DESIGN.md, CONTEXT.md, PRD.md, PROMPT.md, dan WORKFLOW.md merupakan dokumen berikutnya yang disusun terpisah sesuai urutan yang diminta.
