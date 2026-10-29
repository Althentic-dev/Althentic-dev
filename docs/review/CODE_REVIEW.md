PR: #20
Repo: Althentic-dev/Althentic-dev
Status: [ ] dicopas

Review PR #20

```md
`README.md` kini merangkum fitur, batas pembayaran langsung ke seller, konfigurasi Neon dan Supabase, setup lokal, serta migrasi. Pastikan instruksi `bun run db:deploy` untuk branch Neon non-production tetap sesuai dengan alur development yang diinginkan. Badge teknologi memakai gambar Shields.io eksternal, sehingga badge dapat tidak tampil jika layanan tersebut tidak tersedia.

`layout.tsx` menunjuk ke `/logo.svg`, yang tersedia di `public/`. Navbar, footer, dan dialog autentikasi menggunakan file logo yang sama, dan pencarian pemakaian komponen menunjukkan ketiganya dirender melalui app shell. Mohon tinjau hasil visual pada tema terang dan gelap: SVG memiliki bidang gelap dan animasi napas, sementara logo sekarang ditampilkan pada ukuran 36 piksel di latar header, footer, dan dialog. Build tidak memeriksa kecocokan tampilannya.

Entri `CHANGELOG.md` menggambarkan perubahan README dan brand yang memang dilakukan. Checklist `TODO.md` mencatat lint, build, graph, Issue, dan PR; build lokal lulus tetapi Next.js melewati validasi tipe sesuai konfigurasi dan memberi peringatan dua lockfile karena worktree berada di bawah checkout root.

Perubahan `docs/review/CODE_REVIEW.md` mengganti review PR sebelumnya dengan satu blok untuk PR ini dan status salin tetap belum dicentang. Tidak ada perubahan database, storage, atau environment.
```
