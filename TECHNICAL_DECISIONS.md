# Keputusan Teknis

## Neon PostgreSQL dan Prisma

Keputusan ini berlaku sejak migrasi provider database ke Neon PostgreSQL dan menggantikan status SQLite sandbox sebelumnya.

- `DATABASE_URL` menunjuk koneksi pooled Neon untuk query runtime.
- `DIRECT_URL` menunjuk koneksi direct Neon yang dipakai Prisma Migrate pada Prisma 6.
- Schema PostgreSQL dan migration SQL berada di `prisma/schema.prisma` dan `prisma/migrations/`.
- Production memakai `bun run db:deploy` untuk menerapkan migration yang sudah dikomit. `bun run db:push` tidak lagi memakai `--accept-data-loss` dan bukan jalur deployment.
- Data lama dipindahkan oleh `scripts/migrate-sqlite-to-neon.ts` setelah preflight target kosong. Utilitas mempertahankan file sumber serta menolak menimpa object receipt.
- Nilai `DATABASE_URL` dan `DIRECT_URL` wajib disediakan pada Vercel Production; keduanya tidak dicatat atau dicetak.

## Neon Object Storage untuk bukti transfer

Keputusan ini memperbarui catatan provider receipt di SPEC-07-06 dan SPEC-15-01. Catatan Q&A historis tetap disimpan di SPEC/PRD; `docs/ARCHITECTURE.md` dan `DEVIATIONS.md` menjelaskan keputusan implementasi yang berlaku.

- Runtime mengirim objek `private/receipts/...` ke bucket Neon Object Storage yang dikonfigurasi oleh `NEON_STORAGE_BUCKET_RECEIPTS` dan bernilai `receipts`.
- Variabel koneksi memakai nama yang dipakai contoh resmi Neon/S3: `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, dan `AWS_REGION` (`us-east-2`). `NEON_STORAGE_BUCKET_RECEIPTS` adalah konfigurasi aplikasi, bukan variabel yang diterbitkan Neon.
- `AWS_ENDPOINT_URL_S3` harus berupa endpoint S3 khusus branch Neon. Client AWS SDK memakai `forcePathStyle: true` untuk endpoint kustom Neon.
- Runtime menolak endpoint non-HTTPS atau host di luar domain Neon sebelum mengirim kredensial.
- Bucket `receipts` harus sudah dibuat dan disetel private di Neon Console/API. Konfigurasi SDK tidak mengubah visibility bucket atau ACL.
- Aplikasi menolak nama bucket selain `receipts` agar bukti tidak dapat diarahkan ke bucket lain karena salah konfigurasi.
- Signed URL aplikasi tetap melewati `/api/files`; route memverifikasi signature sebelum membaca objek. Operasi unggah, baca, cek keberadaan, dan hapus receipt menggunakan Neon. Screenshot inspeksi dan file non-receipt tetap memakai adapter filesystem lokal.
- Pemindahan receipt lama disiapkan sebagai proses satu kali melalui `scripts/migrate-sqlite-to-neon.ts`; script memetakan `private/receipts/...` ke key bucket `receipts/...`, memeriksa object yang sudah ada, dan menolak menimpa byte berbeda. Import aktual menunggu koneksi Neon tersedia. Bucket serta kredensial Neon harus sudah siap.

## Hasil audit environment variables sebelum migrasi PostgreSQL

Audit membandingkan template dan nama variabel di file `.env` lokal dengan referensi kode, schema Prisma, dan script seed. Nilai `.env` lokal tidak dicatat di dokumen ini.

| Variabel lama atau kandidat | Keputusan | Alasan |
| --- | --- | --- |
| `DIRECT_URL` | Dihapus saat audit awal, kemudian dipulihkan untuk migrasi Prisma PostgreSQL | Pada audit awal schema SQLite hanya memakai `DATABASE_URL`; schema sekarang menetapkan `directUrl = env("DIRECT_URL")`. |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | Dihapus | Autentikasi aplikasi memakai session/secret internal, bukan NextAuth. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PASSWORD`, `SUPABASE_STORAGE_BUCKET_BANNERS`, `SUPABASE_STORAGE_BUCKET_PREVIEWS`, `SUPABASE_STORAGE_BUCKET_BACKUPS` | Dihapus dari `.env.example` dan konfigurasi lokal yang diaudit | Tidak ada adapter atau referensi Supabase di kode saat ini. Banner/preview saat ini masih melewati adapter filesystem. Integrasi Supabase untuk aset tersebut masih pekerjaan terpisah. |
| `GOOGLE_DRIVE_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Dihapus | Inspeksi/download Drive memakai HTTP(S) ke tautan publik, bukan Google Drive API/OAuth resmi. |
| `SCREENSHOT_API_PROVIDER` | Dihapus | Pemilihan provider tidak membaca env ini; kode memeriksa `URLBOX_KEY`, lalu `SCREENSHOTONE_KEY`. |
| `SCREENSHOT_API_KEY` | Dipetakan ke `URLBOX_KEY` pada `.env` lokal | Nilai provider yang dikonfigurasi adalah `urlbox`; nilai key dipertahankan tanpa dicetak. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Dihapus | Rate limiter saat ini menggunakan `Map` in-memory, bukan Upstash. |
| `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `NEXT_PUBLIC_APP_URL` | Dihapus | Tidak direferensikan runtime aplikasi. |
| `BYOK_ENCRYPTION_KEY` | Diganti menjadi `CRYPTO_KEY` | Kode membaca `CRYPTO_KEY`; nilai lama dipertahankan di `.env` lokal. |
| `SMTP_PASSWORD` | Diganti menjadi `SMTP_PASS` | Nodemailer membaca `SMTP_PASS`; nilai lama dipertahankan di `.env` lokal. |
| `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL` | Digabung menjadi `SMTP_FROM` | Nodemailer membaca satu alamat/header `SMTP_FROM`; alamat lokal dibentuk dari nilai lama. |
| `MCP_SECRET_TOKEN` | Diganti menjadi `MCP_SECRET` | Runtime secret MCP membaca nama `MCP_SECRET`; nilai lama dipertahankan. |
| `SUPER_ADMIN_PASSWORD_HASH` | Dihapus | Script seed membaca `SUPER_ADMIN_INITIAL_PASSWORD`, bukan hash ini. Hash tidak dapat dikonversi kembali ke password seed. |
| `SUPABASE_STORAGE_BUCKET_BACKUPS` | Bukan konfigurasi `.env` aplikasi | Repository belum memiliki workflow backup. Kredensial mendatang harus berada di GitHub Actions Secrets; nama bucket/region yang tidak rahasia dapat menjadi Actions Variables atau konfigurasi workflow. Lihat bagian backup di README. |

`SUPABASE_ANON_KEY` tidak diperlukan karena tidak ada akses Supabase client-side. `GOOGLE_DRIVE_API_KEY` tidak diperlukan untuk fetch tautan publik. `SCREENSHOT_API_PROVIDER` juga tidak digunakan. Kesimpulan audit awal bahwa `DIRECT_URL` tidak dibutuhkan berlaku sebelum schema Prisma memakai PostgreSQL dan kini sudah digantikan oleh keputusan di atas.

## Batas integrasi file yang belum tersedia

Keputusan operasional menyebut Supabase Storage untuk banner, preview, dan backup. Source saat ini belum memiliki adapter Supabase maupun workflow backup. Implementasi Neon dalam perubahan ini hanya menangani receipt, sesuai scope; penggunaan Supabase untuk aset lain dan backup tetap belum aktif. Jangan menganggap variabel konfigurasi yang tidak dibaca kode sebagai integrasi yang berfungsi.
