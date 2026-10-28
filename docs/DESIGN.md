# DESIGN.md — Sistem Desain Althentic.Dev

**Sumber utama:** `althentic-brainstorm-result-final.md`, Konteks Terkunci dan 120 Q&A.
**Sumber tambahan khusus desain:** Lampiran Teknis B (isometric block cluster, kini perlu regenerasi grayscale) pada dokumen tersebut. Lampiran Teknis A (GradientASCII) sudah tidak dipakai — lihat Bagian 7.
**Keputusan tambahan:** Sembilan kriteria wajib dalam instruksi pengguna untuk penyusunan DESIGN.md pada 27 Oktober 2026.
**Revisi:** Dokumen direvisi pada percakapan berikutnya — skema warna diubah total ke hitam-putih/grayscale murni (tanpa biru), background dasar menjadi `#050505`, komponen hero GradientASCII dihapus dari rencana, dan icon library beralih dari Lucide CDN murni ke Lucide via Animate UI icon wrappers. Seluruh bagian terkait telah diperbarui mengikuti perubahan ini.
**Referensi keputusan:** ID `SPEC-xx-yy` mengikuti section dan urutan pertanyaan brainstorming, seperti pada SPEC.md.

## 1. Batas dokumentasi

1. Dokumen mencatat keputusan yang sudah diberikan, termasuk sembilan (kini sepuluh) kriteria wajib dan revisi warna/icon/hero terbaru. Seluruh keputusan merupakan instruksi eksplisit pengguna, bukan asumsi penulis.
2. Kutipan "Keputusan sumber" mempertahankan teks asli kecuali pada bagian yang eksplisit ditandai sebagai revisi. Penjelasan props membedakan perilaku kode bawaan dari konfigurasi final Althentic.
3. Nilai token warna, spacing, radius, dan breakpoint tidak ditemukan dalam sumber dan riwayat relevan yang tersedia. Nilai tersebut tidak dianggap pernah dibatalkan; nilainya belum dapat diverifikasi untuk dicantumkan sebagai keputusan final.
4. Setiap rincian yang belum tersedia diberi tanda **[BELUM DIPUTUSKAN — perlu klarifikasi]**. Default kode, ukuran aset, dan contoh tampilan tidak dijadikan token global.
5. Dokumen tidak membuat ulang logo atau gambar pre-footer; tidak menetapkan komponen, layout, maupun nilai CSS baru. GradientASCII tidak lagi menjadi bagian dari dokumen ini (lihat Bagian 7).

## 2. Sembilan kriteria wajib

Teks kriteria berikut dipertahankan dari instruksi terbaru pengguna.

1. Font: Plus Jakarta Sans di seluruh platform.
2. Icon: Lucide, dipakai lewat Animate UI icon wrappers (`@animate-ui/react/icons`). Jangan pernah menggunakan icon emoji, dalam bentuk apa pun.
3. Elemen kustom dengan animasi smooth: custom WebKit scrollbar, custom dropdown, custom checkbox, dan elemen form/UI kustom lainnya — semua dengan transisi/animasi halus, bukan default browser.
4. Accessibility wajib mengikuti standar WCAG di seluruh komponen.
5. Smooth scroll menggunakan Lenis.
6. Responsive design penuh untuk tiga breakpoint: Desktop, Tablet, dan Mobile.
7. Tech stack: Next.js (App Router) sebagai frontend SEKALIGUS backend (API Routes) — satu framework full-stack, bukan React Router terpisah sebagai layer backend. NeonDB Postgres sebagai database, Supabase sebagai storage, Vercel sebagai platform deployment tunggal.
8. Animasi entrance dan exit menggunakan Framer Motion.
9. Gaya visual card (product card, dashboard card, dll) menggunakan Liquid Glass / Glassmorphism style.
10. **Skema warna: hitam-putih/grayscale murni di seluruh platform** (lihat Bagian 3.3) — tanpa warna biru atau aksen warna apa pun pada button, dropdown, card, badge, dll. Background dasar `#050505`.

### 2.1. Penerapan lintas platform

| Area                                                                 | Ketentuan yang berlaku                                                                                                                                                                                                       |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing, dokumentasi, katalog, detail, profil toko, status dan error | Plus Jakarta Sans; icon Lucide via Animate UI; tanpa icon emoji; skema hitam-putih; WCAG; tiga kategori responsive; Lenis; entrance/exit Framer Motion; kontrol kustom dan card Glassmorphism jika terdapat elemen tersebut. |
| Auth, akun, checkout dan koleksi buyer                               | Ketentuan yang sama, termasuk checkbox, dropdown, form, preview upload, dan akses download.                                                                                                                                  |
| Onboarding dan dashboard seller                                      | Ketentuan yang sama, termasuk card analytics, kontrol produk, QR, BYOK, order dan invoice.                                                                                                                                   |
| Dashboard Super-Admin                                                | Ketentuan yang sama, termasuk card overview/analytics, filter, tabel, verifikasi, settings dan dispute.                                                                                                                      |
| Prompt Generator                                                     | Ketentuan yang sama untuk canvas, kontrol blok, ekspor, dan card yang digunakan.                                                                                                                                             |

Tabel tidak menetapkan halaman baru atau mewajibkan penambahan card/dropdown ke area yang belum memilikinya. Ia menetapkan cakupan konsistensi bagi elemen yang digunakan.

## 3. Fondasi dan design tokens

### 3.1. Tipografi

- Font seluruh platform: **Plus Jakarta Sans**.
- Aturan berlaku pada teks halaman, navigasi, kontrol form, dropdown, tabel, card, pesan status, dan teks antarmuka lain.
- `fontFamily` GradientASCII harus mengikuti Plus Jakarta Sans untuk memenuhi ketentuan seluruh platform. Default `Geist Mono` dalam lampiran bukan keputusan font Althentic.
- Ukuran heading/body/label, weight tipografi UI, line-height, letter-spacing, font-loading strategy, dan fallback stack final: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.
- Weight dan ukuran atlas glyph dalam kode GradientASCII adalah detail implementasi visual komponen, bukan skala tipografi UI.

### 3.2. Icon

- Sumber icon: **Lucide**, dipakai melalui **Animate UI icon wrappers** (`@animate-ui/react/icons`), bukan CDN Lucide murni.
- Setiap icon diinstal satu per satu lewat shadcn CLI (`npx shadcn@latest add @animate-ui/icons-lucide-<nama>`), lalu diimpor sebagai komponen React dari `@/components/animate-ui/icons/<nama>` (contoh: `import { Bell } from '@/components/animate-ui/icons/bell'`). Core animasi dipasang otomatis bersama instalasi icon pertama.
- Icon ini tetap Lucide secara visual/semantik (392 icon tersedia pada katalog Animate UI per penulisan dokumen ini) — bukan icon set baru, hanya layer animasi tambahan (trigger seperti `animateOnHover`, dsb) di atasnya.
- Icon emoji tetap dilarang dalam bentuk apa pun, termasuk pengganti icon status, navigasi, aksi, empty state, dan ilustrasi antarmuka.
- Pemetaan nama icon per aksi/halaman, ukuran, stroke width, serta trigger animasi mana yang dipakai di konteks mana (hover/klik/mount): **[BELUM DIPUTUSKAN — perlu klarifikasi]**.
- Sumber brainstorming menyebut ikon resmi Instagram/X/TikTok. Pemetaan kebutuhan tersebut dalam batas "Lucide via Animate UI" belum ditetapkan; tidak menambahkan library icon lain sebagai solusi.

### 3.3. Warna dan tema

**Perubahan arah warna (menggantikan seluruh ketentuan warna sebelumnya):** seluruh platform memakai skema **hitam-putih murni (monokrom/grayscale) saja — tanpa warna biru atau aksen warna apa pun**. Ini berlaku mutlak pada button, dropdown, card, badge, banner, dan seluruh elemen UI lain, di kedua mode (Dark/Light) maupun System.

| Elemen                               | Keputusan yang tersedia                                                                                                                                        | Detail yang belum ditentukan                                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Warna brand/UI                       | Hitam-putih-grayscale murni. Tidak ada warna biru atau aksen warna apa pun di seluruh platform (button, dropdown, card, badge, dll).                           | Nilai HEX grayscale lengkap (abu-abu intermediate), rasio kontras per state.                                                                        |
| Background dasar                     | **`#050505`** (hitam), menggantikan navy sebelumnya.                                                                                                           | Apakah `#050505` berlaku sama di Dark dan Light mode, atau Light mode punya nilai dasar terang terpisah.                                            |
| Mode tampilan                        | Dark / Light / System.                                                                                                                                         | Default awal, penyimpanan preferensi, serta seluruh token per mode (dengan batasan tetap grayscale, tanpa biru).                                    |
| Aksen toko                           | Sebelumnya direncanakan 1 dari 8 preset warna untuk banner/badge/CTA toko — **status berubah seiring penghapusan seluruh warna non-grayscale platform.**       | Apakah aksen toko tetap ada dalam bentuk grayscale (misal: variasi abu-abu/kontras), atau dihapus total.                                            |
| Card                                 | Liquid Glass / Glassmorphism, tetap grayscale (tanpa tint warna).                                                                                              | Opacity, blur, border, shadow, highlight dan fallback visual dalam palet hitam-putih.                                                               |
| Banner penagihan                     | Sebelumnya kuning saat tersisa tiga hari sebelum suspend — **perlu ditinjau ulang karena kuning adalah warna, bertentangan dengan ketentuan grayscale murni.** | Apakah banner peringatan tetap pakai warna (sebagai pengecualian status/alert) atau diganti indikator grayscale (misal: kontras/pola/border tebal). |
| Pre-footer (Isometric Block Cluster) | Sebelumnya navy-ke-biru terang — **perlu digenerate ulang mengikuti skema hitam-putih** (lihat Bagian 8.2).                                                    | Palet grayscale final untuk aset ini.                                                                                                               |

Status seluruh detail pada kolom terakhir: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.

Satu-satunya pengecualian potensial terhadap aturan "tanpa warna" adalah indikator status/alert fungsional (seperti banner penagihan kuning) — status pengecualian ini sendiri **[BELUM DIPUTUSKAN — perlu klarifikasi]**, karena permintaan "hitam putih saja tanpa warna biru" belum secara eksplisit menyebutkan apakah warna status/alert (merah/kuning/hijau untuk error/warning/success) ikut dilarang atau dikecualikan sebagai konvensi UI standar.

### 3.4. Spacing, radius dan ukuran

| Kelompok token                                                | Status                                 |
| ------------------------------------------------------------- | -------------------------------------- |
| Skala spacing global, padding/margin, gap grid, jarak section | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| Radius button, input, dropdown, checkbox, card, modal         | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| Lebar container dan tinggi section/hero                       | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| Ukuran kontrol, lebar scrollbar, tebal border                 | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| Shadow/elevation, blur, opacity dan z-index                   | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| Durasi, easing, delay/stagger dan parameter spring UI         | [BELUM DIPUTUSKAN — perlu klarifikasi] |

Ukuran banner toko 1600×400 px dan rasio aset pre-footer 16:9 adalah spesifikasi aset. Keduanya tidak menetapkan spacing, radius, tinggi section layar, atau breakpoint.

## 4. Responsive design dan navigasi

### 4.1. Tiga kategori responsive

| Kategori | Grid katalog yang sudah diputuskan | Navbar                                             | Batas piksel                           |
| -------- | ---------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Desktop  | 3 kolom.                           | Auto-hide saat scroll down, muncul saat scroll up. | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| Tablet   | 2 kolom.                           | [BELUM DIPUTUSKAN — perlu klarifikasi]             | [BELUM DIPUTUSKAN — perlu klarifikasi] |
| Mobile   | 1 kolom.                           | Tidak auto-hide.                                   | [BELUM DIPUTUSKAN — perlu klarifikasi] |

Responsiveness penuh berlaku pada seluruh platform. Bentuk menu mobile/tablet, perpindahan sidebar, transformasi tabel, susunan form, dan crop gambar per kategori belum ditentukan: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.

Grid katalog 3/2/1 tidak otomatis diterapkan pada grid dashboard atau seluruh card. ResizeObserver milik GradientASCII juga tidak menetapkan nilai breakpoint platform.

### 4.2. Scroll dan animasi

- Smooth scroll menggunakan **Lenis**.
- Scrollbar WebKit menggunakan tampilan kustom.
- Animasi **entrance dan exit menggunakan Framer Motion**.
- Dropdown, checkbox, dan elemen form/UI kustom memiliki transisi/animasi halus.
- Parameter Lenis, nilai transisi, pola entrance/exit tiap elemen, threshold navbar auto-hide, dan perilaku scrollbar pada engine non-WebKit: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.
- Animasi WebGL internal GradientASCII mengikuti source code lampiran; itu tidak menggantikan kewajiban Framer Motion untuk entrance/exit UI.

## 5. Kontrol kustom dan Liquid Glass

### 5.1. Kontrol antarmuka

| Elemen             | Keputusan yang harus diterapkan                                                  | Detail visual/interaksi yang belum diberikan                  |
| ------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| WebKit scrollbar   | Kustom, selaras dengan antarmuka, transisi halus sesuai kriteria pengguna.       | Lebar, thumb, track, radius, warna tiap state.                |
| Dropdown           | Tampilan kustom dan animasi halus; berlaku pada penggunaan dropdown di platform. | Ukuran menu, posisi, padding, durasi, pemetaan state.         |
| Checkbox           | Tampilan kustom dan transisi halus.                                              | Dimensi, radius, warna, bentuk indikator dan motion.          |
| Input/form/UI lain | Tampilan kustom, font Plus Jakarta Sans, animasi halus dan WCAG.                 | Tinggi, spacing, border, focus/error style, variasi komponen. |
| Button/CTA         | Mengikuti ketentuan global; CTA toko dapat memakai aksen preset sesuai sumber.   | Variant, radius, ukuran, padding, detail state.               |

Status detail kolom terakhir: **[BELUM DIPUTUSKAN — perlu klarifikasi]**. “Kustom” merupakan keputusan tampilan/interaksi; bukan instruksi menghapus semantik dan aksesibilitas kontrol.

### 5.2. Card

- Product card, dashboard card, dan card lain memakai **Liquid Glass / Glassmorphism style**.
- Isi, fungsi, dan jumlah card tetap mengikuti brainstorming. Gaya baru tidak menambah informasi atau mengubah urutan konten.
- Font tetap Plus Jakarta Sans, icon tetap Lucide via CDN, entrance/exit tetap Framer Motion.
- Penerapan responsive dan WCAG tetap wajib pada Dark, Light, dan System.
- Nilai blur, opacity, tint, border, radius, shadow, efek refraksi, hover, dan fallback ketika efek tidak tersedia: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.
- Istilah Liquid Glass tidak menetapkan penggunaan shader, library tambahan, atau animasi refraksi tertentu.

## 6. Accessibility

**Seluruh komponen wajib mengikuti WCAG**, termasuk kontrol kustom, card Glassmorphism, tabel, lightbox, form, navigasi, canvas generator dan dekorasi animasi.

Versi WCAG serta target tingkat kesesuaian A/AA/AAA: **[BELUM DIPUTUSKAN — perlu klarifikasi]**. Dokumen ini tidak mengklaim implementasi telah lulus audit.

### 6.1. Cakupan pemeriksaan penerapan kewajiban WCAG

| Area                            | Cakupan yang perlu diperiksa saat implementasi                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| Teks dan Glassmorphism          | Keterbacaan/kontras pada latar aktual, seluruh tema dan state.                               |
| Kontrol kustom                  | Semantik, nama kontrol, state, operasi keyboard dan fokus.                                   |
| Icon Lucide                     | Makna aksi dapat dikenali teknologi bantu; icon dekoratif tidak menjadi informasi pengganti. |
| Form dan upload                 | Label, instruksi, status wajib, pesan kesalahan, dan feedback.                               |
| Navigasi, dropdown dan lightbox | Operasi keyboard serta pengelolaan fokus.                                                    |
| Responsive                      | Pembesaran teks, reflow dan akses konten pada tiga kategori perangkat.                       |
| Animasi, Lenis dan hero         | Preferensi pengurangan gerakan serta pengaruh gerakan pada penggunaan antarmuka.             |
| Generator                       | Akses operasi reorder tanpa menjadikan drag pointer sebagai satu-satunya cara penggunaan.    |

Tabel ini adalah cakupan verifikasi kewajiban aksesibilitas pengguna, bukan rancangan kontrol tambahan, pemilihan pola ARIA, atau penetapan nilai token. Pola interaksi rinci, implementasi alternatif reorder, angka target sesuai level WCAG, dan metode audit: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.

### 6.2. Catatan aksesibilitas animasi (berlaku umum)

- `prefers-reduced-motion` wajib dihormati di seluruh animasi platform (Framer Motion, Lenis, dan animasi icon Animate UI), bukan hanya pada komponen background yang kini sudah dihapus dari dokumen ini (lihat Bagian 7).
- Perilaku spesifik reduced-motion untuk tiap jenis animasi (entrance/exit, hover icon, scroll Lenis): **[BELUM DIPUTUSKAN — perlu klarifikasi]**.

## 7. Hero background — status terbuka

Komponen GradientASCII (reactbits.dev) yang sebelumnya direncanakan sebagai background Hero Section **DIHAPUS dari dokumen ini**. Background hero tidak lagi ditangani lewat komponen ini di tahap pembangunan awal — akan ditambahkan kemudian secara terpisah bersama Codex CLI, di luar cakupan AI build-agent yang mengeksekusi dokumen ini.

Hero Section pada tahap awal dibangun **tanpa background animasi khusus** — cukup latar polos mengikuti warna dasar platform (`#050505`, lihat Bagian 3.3), sampai ada ketentuan lanjutan.

## 8. Aset visual final

### 8.1. Logo Althentic

- Warna acuan logo **berubah mengikuti skema hitam-putih baru** (lihat Bagian 3.3) — referensi navy-ke-biru terang pada versi sebelumnya sudah tidak berlaku.
- Sumber yang tersedia tidak melampirkan file logo ataupun spesifikasi bentuk, proporsi, clear space, ukuran minimum, varian tema dan format ekspornya.
- Detail tersebut: **[BELUM DIPUTUSKAN — perlu klarifikasi]**. Dokumen tidak menebak bentuk logo dari project lain atau menciptakan logo baru.
- Lokasi penggunaan dan ukuran logo pada navbar/footer: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.

### 8.2. Isometric Block Cluster — Pre-Footer

**Status: PERLU DIGENERATE ULANG.** Deskripsi gambar final versi sebelumnya (disalin dari Lampiran B) memakai gradasi navy-ke-biru terang, yang sudah **tidak sesuai dengan skema warna hitam-putih baru**. Gambar final versi lama tidak lagi berlaku sebagai aset siap pakai.

**Arahan untuk regenerasi prompt gambar baru:**

- Format: wide banner 16:9, landscape, full-width section — tidak berubah.
- Gaya: isometric 3D cube clusters, metalik/glossy, dengan efek glow — tidak berubah.
- Warna: **diganti ke skema grayscale/hitam-putih murni** — gradasi abu-abu gelap ke terang menggantikan navy-ke-biru, cube paling gelap mendekati hitam (`#050505`), cube paling terang mendekati putih, tanpa nuansa biru sama sekali.
- Komposisi: 3 cluster cube terpisah dengan ruang kosong di antaranya — tidak berubah. Garis dasar bercahaya yang sebelumnya biru perlu disesuaikan jadi putih/abu-abu terang bercahaya (glow monokrom).
- Background: perlu ditentukan ulang — opsi hitam `#050505` (konsisten dengan background dasar platform) atau putih (kontras tinggi terhadap cube gelap): **[BELUM DIPUTUSKAN — perlu klarifikasi]**.
- Tujuan: dekorasi transisi visual sebelum footer, menandakan kualitas/craftsmanship produk secara abstrak — tanpa teks, tanpa logo, tanpa watermark — tidak berubah.

Prompt generation gambar baru perlu dibuat terpisah mengikuti arahan grayscale di atas. Penyesuaian untuk Dark Mode, crop Desktop/Tablet/Mobile, format file, lokasi file final dan resolusi piksel: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.

## 9. Ketentuan halaman dan komponen yang sudah dibrainstorm

Seluruh keputusan berikut dibaca bersama kriteria pada bagian 2. Product card dan dashboard card menggunakan Glassmorphism; kontrol menggunakan tampilan kustom, Plus Jakarta Sans dan Lucide via CDN; aksesibilitas dan responsive tetap berlaku.

### 9.1. Landing dan dokumentasi

- Konteks Terkunci menetapkan Landing Page 9 section dan Documentation Page 12 section bergaya GitBook.
- Lampiran A menetapkan Hero pada section 1; Lampiran B menetapkan pre-footer pada section 8.
- Daftar lengkap section, copy, CTA, navigasi dokumentasi dan layout per section tidak tersedia dalam sumber ini: **[BELUM DIPUTUSKAN — perlu klarifikasi]**. Tidak menambahkan nama/urutan section lain sendiri.

### 9.2. Katalog dan detail produk

**Keputusan sumber — SPEC-03-01**

> Grid kartu 3 kolom di desktop (2 tablet, 1 mobile): preview gambar, judul, harga termurah dari tipe jual yang tersedia, badge kategori, rating, dan nama toko.

**Keputusan sumber — SPEC-03-02**

> Filter Kategori, Tipe Jual (Template Jadi / Prompt saja / Bundle), Rentang Harga (chip preset), dan Rating Minimum — semuanya tersimpan sebagai URL query sehingga hasil filter bisa di-share dan tombol back browser berfungsi.

**Keputusan sumber — SPEC-03-03**

> Default “Terlaris minggu ini”, dengan opsi: Terbaru, Termurah, Termahal, Rating tertinggi.

**Keputusan sumber — SPEC-03-04**

> Mencari di judul produk, deskripsi, dan nama toko; debounce 300ms; state “tidak ada hasil” menampilkan 3 chip kategori populer sebagai saran.

**Keputusan sumber — SPEC-03-05**

> Pagination klasik 24 produk per halaman dengan nomor halaman dan URL yang ikut berganti.

**Keputusan sumber — SPEC-03-06**

> Preview besar (klik untuk lightbox) → judul, nama toko, rating → pilihan tipe jual A/B/C dengan harga → deskripsi lengkap → info file (ukuran .zip, isi) → review → produk serupa.

**Keputusan sumber — SPEC-03-07**

> Produk tetap bisa dibeli buyer lain secara paralel tanpa antrian.

**Keputusan sumber — SPEC-03-08**

> Bintang + jumlah review ringkas, contoh “4.8 (23)” — detail ulasan tetap di halaman detail.

Product card mengikuti Liquid Glass / Glassmorphism; gaya badge, filter chip, lightbox, pilihan tipe jual dan review belum memiliki ukuran/radius/spacing final. Nilai token tersebut: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.

### 9.3. Toko dan onboarding seller

**Keputusan sumber — SPEC-02-02**

> Seller memilih 1 warna aksen dari 8 preset terkurasi yang hanya diterapkan pada banner, badge, dan tombol CTA tokonya — tidak menyentuh kerangka UI platform.

**Keputusan sumber — SPEC-02-03**

> Satu banner 1600x400 px (rasio 4:1), JPG/PNG maksimal 2 MB, dikonversi otomatis ke .webp, dengan preview tampilan desktop dan mobile sebelum disimpan.

**Keputusan sumber — SPEC-02-04**

> Deskripsi maksimal 500 karakter plain-text, ditambah field terpisah untuk maksimal 3 link sosial media (Instagram, X, TikTok) yang dirender sebagai ikon resmi.

**Keputusan sumber — SPEC-06-01**

> Empat langkah berurutan: (1) profil toko (nama, slug, deskripsi), (2) unggah QR pembayaran, (3) API key AI semi-optional dengan penjelasan konsekuensi, (4) tambah produk pertama dan kirim verifikasi.

**Keputusan sumber — SPEC-06-02**

> Wajib gambar JPG/PNG maksimal 2 MB dengan preview besar, plus checkbox pernyataan “Saya sudah menguji scan QR ini dan nominalnya masuk ke rekening saya”.

**Keputusan sumber — SPEC-06-03**

> Lewati diperbolehkan dengan konsekuensi yang ditulis eksplisit di layar (“Semua order harus Anda approve manual”), dan langkah ini bisa diisi belakangan di Settings toko.

**Keputusan sumber — SPEC-06-04**

> Setelah memiliki minimal 1 produk berstatus terverifikasi (lolos inspeksi); sebelum itu toko berstatus “Disiapkan” yang hanya terlihat oleh pemiliknya.

**Keputusan sumber — SPEC-06-05**

> Setiap langkah tersimpan otomatis sebagai draft; dashboard menampilkan checklist “Toko Anda X% siap” dengan tombol langsung ke langkah yang belum selesai.

**Keputusan sumber — SPEC-06-06**

> Halaman “Toko Anda siap” berisi 3 langkah berikutnya: bagikan link toko, kirim produk pertama untuk verifikasi, dan kenali halaman Komisi & Tagihan — dengan status verifikasi yang terlihat realtime.

**Keputusan sumber — SPEC-13-01**

> URL /toko/{slug} menampilkan branding, warna aksen, deskripsi, ikon sosial media, statistik publik (jumlah produk, rating rata-rata, tahun bergabung), dan grid produknya.

Preview upload, dropdown aksen, checkbox pernyataan QR dan kontrol onboarding tunduk pada ketentuan kustom/WCAG. Persentase kesiapan dan status realtime sudah disebut sumber; bentuk visual indikator, detail state dan transport realtime belum diputuskan.

Ikon sosial resmi dalam kutipan tidak memberi pengecualian terhadap aturan terbaru “hanya Lucide via CDN”. Pemetaan representasinya: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.

### 9.4. Auth, checkout dan koleksi

**Keputusan sumber — SPEC-05-01**

> Email + password sebagai jalur utama, dengan tombol “Lanjutkan dengan Google” sebagai alternatif yang setara.

**Keputusan sumber — SPEC-05-06**

> Ubah nama, ganti password, ganti email (wajib re-verifikasi), preferensi email notifikasi, dan hapus akun (soft-delete dengan masa tenggang 30 hari).

**Keputusan sumber — SPEC-05-07**

> 30 hari dengan opsi “Ingat saya di perangkat ini” dicentang; tanpa itu 1 hari; logout manual selalu tersedia.

**Keputusan sumber — SPEC-04-01**

> Wajib punya akun (email + password atau Google) sebelum masuk halaman checkout; registrasi bisa diselesaikan dari halaman produk tanpa kehilangan konteks.

**Keputusan sumber — SPEC-04-03**

> Nomor WA diambil dari field wajib saat onboarding seller (divalidasi format Indonesia), dirender sebagai tombol “Hubungi via WhatsApp” dengan pesan template berisi ID order dan nama produk.

**Keputusan sumber — SPEC-04-04**

> Satu gambar per percobaan, format JPG/PNG/HEIC maksimal 5 MB, wajib melalui layar preview sebelum submit, ditolak di sisi client jika bukan gambar valid.

**Keputusan sumber — SPEC-04-05**

> (Ketik sendiri) Enam status: Menunggu Pembayaran → Menunggu Verifikasi → Booked (jalur manual) → Lunas (file terbuka) → Dibatalkan → Kedaluwarsa, ditampilkan sebagai timeline stepper dengan timestamp tiap perubahan. seperti yang sudah saya bilang, jangan pernah menampilkan link google drive nya. jadi, link tersebut berada didalam button yang mana button tersebut ketika diklik, file .zip nya akan terdownload tanpa redirect ke google drive

**Keputusan sumber — SPEC-04-08**

> Selama status masih “Menunggu Pembayaran” atau “Menunggu Verifikasi”, buyer bisa batalkan sendiri satu klik; setelah Lunas, hanya lewat jalur dispute.

**Keputusan sumber — SPEC-11-03**

> Hanya 1 kali download, tanpa kecuali dan tanpa reset.

**Keputusan sumber — SPEC-11-06**

> Halaman “Koleksi Saya” permanen di akun buyer: semua order Lunas dengan tombol download, info versi, dan tanggal beli.

Checkbox Ingat saya dan persetujuan, form auth, upload dan tombol download mengikuti aturan global. Bentuk visual input, password visibility control, pesan validasi, stepper dan pilihan login belum dirinci: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.

Ketentuan link tidak tampil mentah tetap berlaku. Konflik delivery tanpa redirect vs 302, makna Booked, dan tampilan tombol setelah kuota unduh habis tetap mengikuti daftar gap SPEC.md; dokumen desain tidak menyelesaikan logika bisnis tersebut.

### 9.5. Dashboard seller dan Super-Admin

**Keputusan sumber — SPEC-02-05**

> Tabel dengan kolom ID order, produk, harga, status (Menunggu Verifikasi / Booked / Lunas / Dibatalkan / Kedaluwarsa), waktu relatif (“2 jam lalu”); filter default “Menunggu Verifikasi + Booked” agar aksi menunggu selalu di atas.

**Keputusan sumber — SPEC-02-06**

> Checklist 3 item wajib dicentang: nominal terlihat sesuai, nama/nomor pengirim terbaca di bukti, dan waktu transfer masuk akal dengan rentang order.

**Keputusan sumber — SPEC-02-08**

> Empat kartu: transaksi terverifikasi, revenue kotor, Commission Owed berjalan, dan produk terlaris — dilengkapi grafik 30 hari dan tabel 5 produk teratas.

**Keputusan sumber — SPEC-01-01**

> “7 hari terakhir” sebagai periode default, dengan tab cepat: Hari ini / 7 hari / 30 hari / 90 hari / Custom.

**Keputusan sumber — SPEC-01-02**

> GMV estimasi (nilai transaksi terverifikasi), jumlah transaksi terverifikasi, komisi tertagih vs outstanding, dan rasio seller aktif vs suspend — satu layar langsung menjawab “sehat atau tidaknya marketplace”.

**Keputusan sumber — SPEC-01-03**

> Line chart harian tetap ditampilkan, ditambah garis kedua berupa moving average 7 hari sebagai baseline tren.

**Keputusan sumber — SPEC-01-04**

> Export CSV per-tabel (transaksi, komisi, seller) dengan semua filter aktif diterapkan ke file yang diunduh.

**Keputusan sumber — SPEC-01-07**

> Textarea template di Settings dengan placeholder {nama_buyer}, {nama_produk}, {jumlah}, {slug_toko}, plus tombol “Uji pratinjau” yang merender contoh pesan.

**Keputusan sumber — SPEC-09-03**

> Email otomatis (Nodemailer) berisi jumlah tunggakan, cara bayar, batas tanggal suspend, ditambah banner kuning di dashboard seller saat tersisa 3 hari sebelum suspend.

**Keputusan Konteks Terkunci — dashboard Super-Admin:**

> Dashboard Super-Admin yang sudah diputuskan: Overview lengkap (metrik ringkas + growth chart + kategori terlaris); single Super-Admin hardcoded; tabel seller (nama toko, slug, jumlah produk, commission owed, status, tanggal join, total transaksi terverifikasi, rating); list verifikasi produk berupa tabel + filter + search + audit trail di tab “Riwayat Verifikasi”; Dispute Resolution berupa inbox sederhana (Open/Investigating/Resolved), komunikasi di luar platform, refund manual di luar sistem.

Card metrik memakai Glassmorphism. Dropdown filter dan checklist approval harus kustom, bertransisi halus dan memenuhi WCAG. Chart library, warna seri, layout dashboard, sidebar, perilaku tabel mobile/tablet serta dimensi card: **[BELUM DIPUTUSKAN — perlu klarifikasi]**.

### 9.6. Prompt Generator, notifikasi dan halaman tambahan

**Keputusan sumber — SPEC-12-01**

> Publik tanpa login untuk mencoba, dengan ekspor terbatas; akun terdaftar membuka ekspor penuh dan integrasi marketplace.

**Keputusan sumber — SPEC-12-03**

> Tujuh blok inti: Peran (Role), Tugas (Task), Konteks, Format Output, Batasan (Constraints), Contoh (Examples), dan Tone/Gaya.

**Keputusan sumber — SPEC-12-04**

> Kolom vertikal drag-and-reorder dengan drag handle per blok; urutan blok menentukan urutan struktur prompt akhir.

**Keputusan sumber — SPEC-12-05**

> Tiga format: Markdown terstruktur, plain text siap-tempel ke chat AI, dan JSON dengan tiap blok sebagai key.

**Keputusan sumber — SPEC-12-06**

> Tombol “Coba di Generator” di halaman detail produk tipe “Prompt saja”; struktur prompt terjual tampil sebagai template read-only di canvas, dengan isi tersembunyi sampai pembelian selesai.

**Keputusan sumber — SPEC-13-02**

> Ikon lonceng dengan panel berisi: update order, hasil verifikasi produk, tagihan komisi/invoice, dan update produk yang dibeli — lengkap dengan penanda belum-baca dan link ke objek terkait.

**Keputusan sumber — SPEC-13-03**

> Tema tampilan (Dark/Light/System), bahasa email notifikasi (ID/EN), dan preferensi email promosi yang bisa dimatikan.

**Keputusan sumber — SPEC-13-04**

> Mengikuti bahasa visual landing page: hero Gradient ASCII, pesan singkat, dan tiga tautan pemulihan (katalog, produk terlaris, halaman sebelumnya); varian 500 menampilkan “tim sudah diberi tahu”.

**Keputusan sumber — SPEC-13-05**

> Ya, versi sederhana di /status: kesehatan Neon, Supabase Storage, dan endpoint kritis; diperbarui manual saat insiden ditambah halaman statis sehari-hari.

Layout blok generator, ukuran drag handle, icon setiap blok, panel ekspor, tampilan notification center dan status page belum dirinci: **[BELUM DIPUTUSKAN — perlu klarifikasi]**. Icon lonceng dan drag handle jika menggunakan icon harus mengikuti Lucide via CDN. Penggunaan card tetap Glassmorphism.

## 10. Batas teknologi desain

| Bagian                                              | Keputusan yang berlaku                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend dan backend                                | Next.js App Router sekaligus API Routes dalam satu framework full-stack.                                                                                                                                                                                                                                                    |
| Routing                                             | Mengikuti Next.js App Router; tidak menambahkan React Router sebagai layer backend terpisah.                                                                                                                                                                                                                                |
| Database                                            | NeonDB Postgres.                                                                                                                                                                                                                                                                                                            |
| File storage                                        | Supabase Storage.                                                                                                                                                                                                                                                                                                           |
| Deployment aplikasi                                 | Vercel sebagai platform tunggal.                                                                                                                                                                                                                                                                                            |
| Icon                                                | Lucide, via Animate UI icon wrappers (`@animate-ui/react/icons`, instal per-icon lewat shadcn CLI).                                                                                                                                                                                                                         |
| Scroll                                              | Lenis.                                                                                                                                                                                                                                                                                                                      |
| Entrance/exit                                       | Framer Motion.                                                                                                                                                                                                                                                                                                              |
| Hero background                                     | Tidak ada komponen aktif untuk tahap ini — GradientASCII dihapus dari rencana (lihat Bagian 7); ditangani terpisah nanti bersama Codex CLI.                                                                                                                                                                                 |
| Komponen UI tambahan (dipertimbangkan, belum final) | Primitives Animate UI lain (Accordion, Alert Dialog, Checkbox, Combobox, Dialog, Sidebar, Pagination, Select, Switch, Toast, Bottom Navigation, Ripple Button, Theme Toggler, Counting Number, Sliding Number) — kesesuaiannya untuk Althentic belum dikonfirmasi per komponen: **[BELUM DIPUTUSKAN — perlu klarifikasi]**. |

Library styling, CSS framework, library form/dropdown, chart library dan versi dependency: **[BELUM DIPUTUSKAN — perlu klarifikasi]**. Kebutuhan kontrol kustom dan Glassmorphism tidak dianggap sebagai pemilihan library tambahan. Animate UI sendiri dibangun di atas shadcn/ui dan Base UI sebagai primitives dasar — apakah shadcn/ui dipakai lebih luas di luar kebutuhan Animate UI juga belum diputuskan.

## 11. Gap yang perlu klarifikasi

| ID            | Detail yang belum tersedia                                                                                                                                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DESIGN-GAP-01 | Nilai HEX grayscale lengkap (abu-abu intermediate), palet Dark/Light dalam skema hitam-putih, dan status aksen toko (apakah masih ada dalam bentuk grayscale atau dihapus).                                                                                                                                   |
| DESIGN-GAP-02 | Spacing scale, radius scale, ukuran container, tinggi hero, ukuran kontrol.                                                                                                                                                                                                                                   |
| DESIGN-GAP-03 | Batas piksel Desktop/Tablet/Mobile; perilaku navbar Tablet; susunan tabel/sidebar/form responsive.                                                                                                                                                                                                            |
| DESIGN-GAP-04 | Font size/weight/line-height/letter-spacing UI dan strategi pemuatan Plus Jakarta Sans.                                                                                                                                                                                                                       |
| DESIGN-GAP-05 | Pemetaan nama icon Animate UI per aksi/halaman, ukuran/stroke, trigger animasi (hover/klik/mount) yang dipakai di tiap konteks, representasi ikon sosial dalam batas Lucide saja.                                                                                                                             |
| DESIGN-GAP-06 | Nilai blur/opacity/tint/border/shadow/radius dan fallback Glassmorphism dalam palet grayscale.                                                                                                                                                                                                                |
| DESIGN-GAP-07 | Bentuk dan state scrollbar/dropdown/checkbox/form serta parameter transisi.                                                                                                                                                                                                                                   |
| DESIGN-GAP-08 | Versi dan level WCAG, detail interaksi aksesibel, reduced-motion lintas platform dan metode verifikasi.                                                                                                                                                                                                       |
| DESIGN-GAP-09 | Konfigurasi Lenis, varian entrance/exit Framer Motion, durasi/easing.                                                                                                                                                                                                                                         |
| DESIGN-GAP-10 | Hero Section tanpa background animasi: tinggi section, layout final, dan apakah akan ada dekorasi statis sementara sebelum Codex CLI menambahkan background.                                                                                                                                                  |
| DESIGN-GAP-11 | File logo final, bentuk yang dapat diverifikasi, ukuran, clear space dan varian tema — mengikuti skema warna hitam-putih baru.                                                                                                                                                                                |
| DESIGN-GAP-12 | Prompt generation baru untuk aset pre-footer (grayscale), background hitam vs putih untuk aset tersebut, format/resolusi, crop responsive dan perlakuan pada Dark Mode.                                                                                                                                       |
| DESIGN-GAP-13 | Rincian lengkap 9 section landing dan 12 section dokumentasi yang tidak ikut tersedia.                                                                                                                                                                                                                        |
| DESIGN-GAP-14 | Detail state UI yang bergantung pada konflik Booked, download, suspend, onboarding dan notifikasi produk di SPEC.md.                                                                                                                                                                                          |
| DESIGN-GAP-15 | Status warna fungsional/status (error/warning/success, termasuk banner penagihan kuning) terhadap aturan "tanpa warna" — apakah dikecualikan atau ikut diganti grayscale/pola/kontras.                                                                                                                        |
| DESIGN-GAP-16 | Daftar final primitives Animate UI tambahan (Accordion, Alert Dialog, Checkbox, Combobox, Dialog, Sidebar, Pagination, Select, Switch, Toast, Bottom Navigation, Ripple Button, Theme Toggler, Counting Number, Sliding Number) yang akan dipakai di Althentic, dan pemetaannya ke halaman/komponen spesifik. |

Status seluruh baris: **[BELUM DIPUTUSKAN — perlu klarifikasi]**. Tidak ditemukannya token di sumber yang tersedia tidak diisi dengan nilai framework default atau rekomendasi penulis.

## 12. Pemeriksaan kesesuaian dokumen dan implementasi

1. Plus Jakarta Sans berlaku di seluruh platform, termasuk override font glyph GradientASCII.
2. Semua icon berasal dari Lucide via CDN; tidak ada icon emoji.
3. Scrollbar WebKit, dropdown, checkbox dan kontrol lain berkustom dengan transisi halus.
4. WCAG berlaku pada seluruh komponen; kepatuhan tidak dinyatakan selesai sebelum diuji.
5. Smooth scroll memakai Lenis.
6. Responsive mencakup Desktop, Tablet dan Mobile; grid katalog mengikuti 3/2/1.
7. Framework full-stack tetap Next.js App Router/API Routes, NeonDB, Supabase Storage dan Vercel.
8. Entrance dan exit memakai Framer Motion.
9. Seluruh card memakai Liquid Glass / Glassmorphism.
10. Hero menggunakan komponen lampiran; default teknis tidak dianggap konfigurasi brand final.
11. Pre-footer mempertahankan deskripsi final: tiga cluster, background putih, tanpa teks/logo/watermark.
12. Tidak ada token warna/spacing/radius/breakpoint numerik baru yang ditetapkan tanpa sumber.

Checklist ini untuk verifikasi terhadap keputusan pengguna; bukan klaim bahwa aplikasi atau aset sudah dibangun dan diuji. Dokumen berikutnya adalah CONTEXT.md.
