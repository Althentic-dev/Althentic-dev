PR: #18
Repo: Althentic-dev/Althentic-dev
Status: [ ] dicopas

Review PR #18

```md
Perubahan 1.173 karakter em dash menjadi tanda hubung biasa tersebar di 133 file teks, termasuk copy UI dan pesan API. Pemeriksaan menunjukkan perubahan source hanya mengganti karakter tersebut, dan lint serta build lulus. Mohon tinjau beberapa contoh copy UI dan dokumentasi untuk memastikan tanda hubung ASCII tetap terbaca sesuai konteks.

`db/custom.db` juga berubah secara biner. Laporan menyatakan 43 penggantian dalam 38 nilai teks, jumlah record tetap, integrity check lulus, dan tidak ada em dash tersisa. Diff Git biasa tidak memperlihatkan nilai database yang berubah; mohon pastikan file ini memang fixture lokal yang seharusnya di-commit dan perubahan SQL-level tidak menyentuh nilai lain.

Graphify memperbarui graph code, tetapi melaporkan parser SQL opsional tidak tersedia. Ini tidak tampak memengaruhi build aplikasi, namun graph tidak mencakup isi SQL tersebut.
```
