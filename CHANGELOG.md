# Changelog

## [Unreleased]
<!-- ENTRI-BARU-SISIPKAN-DI-SINI -->

### Unreleased Update

- Ganti tombol tema Navbar dengan ThemeToggler Animate UI yang menyikluskan mode terang, sistem, dan gelap.

### Unreleased Update

- Tampilkan skeleton loader spesifik view saat pemuatan modul atau data awal, cegah flash autentikasi, hormati reduced motion, dan tampilkan error dashboard setelah request gagal.

### Unreleased Update

- Hilangkan teks fallback yang menduplikasi “Althentic” selama Particle Text dimuat; teks visual splash kini hanya berasal dari animasi.

### Unreleased Update

- Tampilkan splash screen “Althentic” dengan Particle Text biru saat halaman dimuat ulang; animasi dimuat secara lazy dan mengikuti preferensi reduced motion.

### Unreleased Update

- Ubah CTA utama “Jelajahi Katalog” menjadi warna solid sesuai token tema, tanpa mengubah ripple, ukuran, atau interaksinya.

### Unreleased Update

- Perjelas README dengan judul terpusat, badge stack, dan panduan setup yang lebih terstruktur; gunakan logo Althentic pada navbar, footer, dialog autentikasi, dan metadata ikon situs.

### Unreleased Update

- Ganti karakter U+2014 dengan tanda hubung biasa pada file teks proyek dan database SQLite lokal; struktur serta jumlah record database tetap terjaga.

### Unreleased Update

- Simpan aset banner dan QR toko serta preview produk di bucket publik Supabase pada production, cek readiness kedua storage, dan sediakan migrasi file lokal tanpa overwrite.

### Unreleased Update

- Catat nama error dan kode Prisma yang sudah disaring saat probe database production gagal, tanpa memasukkan pesan error atau kredensial ke log.

### Unreleased Update

- Migrasikan database Prisma ke Neon PostgreSQL dengan migration deploy yang aman, sediakan utilitas impor data SQLite dan receipt lama tanpa menghapus sumber, serta sediakan `/api/health` yang memakai status readiness HTTP 200/503. Build standalone kini menyalin aset lewat Node.js agar kompatibel dengan Windows dan Linux.

### Unreleased Update

- Perbaiki opsi `next/dynamic` agar setiap view dapat dikompilasi oleh Turbopack di Next.js 16.

### Unreleased Update

- Simpan bukti transfer WebP private di Neon Object Storage bucket `receipts` melalui AWS S3 SDK; rapikan env example dan dokumentasi konfigurasi serta backup GitHub Actions.

### Unreleased Update

- Memperketat konfigurasi secret production, validasi jaringan dan ukuran payload termasuk stream unduhan Google Drive yang dibatasi 100 MiB dan 55 detik, serta transisi order dan kuota unduhan agar bersifat atomik.
- Memuat view SPA secara dinamis dan mendokumentasikan status schema SQLite lokal terhadap target database PostgreSQL production.
