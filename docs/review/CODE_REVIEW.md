PR: #24
Repo: Althentic-dev/Althentic-dev
Status: [ ] dicopas

Review PR #24

```md
`src/components/ui/particle-text.tsx` memakai implementasi ReactBits dari dokumentasi yang disediakan. Saat `idleDrift` bernilai nol, loop canvas berhenti setelah pengumpulan partikel selesai, dan cleanup melepas observer, listener, serta frame yang tersisa.

`src/components/app/splash-screen.tsx` memuat animasi secara lazy, menampilkan fallback teks biru selama bundle dimuat, menghormati reduced motion, lalu meng-unmount canvas. Timer tetap berdurasi sekitar 2,1 detik tanpa menunggu kesiapan halaman; mohon pastikan durasi ini terasa tepat pada jaringan seluler lambat.

`src/app/layout.tsx` memasang overlay di root. Karena view aplikasi berubah melalui History API tanpa remount layout, splash tidak muncul saat navigasi internal. `CHANGELOG.md` dan `TODO.md` mencatat cakupan serta validasi yang dilakukan. Tidak ada perubahan database, storage, environment, atau data pengguna.
```
