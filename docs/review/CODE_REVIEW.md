PR: #26
Repo: Althentic-dev/Althentic-dev
Status: [ ] dicopas

Review PR #26

```md
`src/components/app/splash-screen.tsx` tidak lagi merender fallback statis, sehingga teks visual hanya berasal dari Particle Text. Label status dan teks screen-reader dari komponen tetap tersedia. Karena tidak ada fallback visual saat chunk dimuat, overlay dapat tampak kosong pada jaringan lambat sebelum canvas siap; mohon cek perilaku ini di Preview pada koneksi seluler lambat.

`CHANGELOG.md` mencatat penghapusan teks duplikat. `TODO.md` mencatat implementasi, validasi, dan PR. Tidak ada file `docs/reactbits/` yang dilacak atau dimasukkan, dan aturan ignore untuk direktori tersebut sudah tersedia di main.
```
