// =============================================================================
// Althentic.Dev - Konten Dokumentasi (Task B2)
// Data terstruktur 12 section untuk DocsPage (gaya GitBook/Docusaurus).
// Markup inline yang didukung: **teks tebal** dan `kode`.
// Semua istilah diselaraskan dengan src/lib/constants.ts agar konsisten
// dengan UI (label status order, tipe jual, blok generator, batasan upload).
// =============================================================================

export type CalloutTone = "info" | "warning" | "danger" | "success";
export type TimelineTone = "warn" | "info" | "ok" | "bad" | "muted";

export type DocBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "steps"; items: { title: string; text: string }[] }
  | { kind: "callout"; tone: CalloutTone; title: string; text: string }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "code"; label?: string; code: string }
  | { kind: "kv"; items: { term: string; def: string }[] }
  | { kind: "timeline"; items: { label: string; text: string; tone: TimelineTone }[] }
  | { kind: "links"; items: { label: string; desc: string; to: Record<string, string>; reset?: boolean }[] }
  | { kind: "faq"; items: { q: string; a: string[] }[] };

export interface DocSection {
  id: string;
  num: number;
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  keywords: string[];
  blocks: DocBlock[];
  special?: "changelog";
}

export const DOCS_SECTIONS: DocSection[] = [
  // -------------------------------------------------------------- 1. Getting Started
  {
    id: "getting-started",
    num: 1,
    title: "Getting Started",
    subtitle:
      "Kenali Althentic.Dev dan mulai dalam tiga langkah - dari menjelajahi katalog sampai mengeksekusi prompt pertamamu.",
    icon: "rocket",
    keywords: ["mulai", "pengantar", "intro", "akun", "daftar", "verifikasi email", "katalog", "syarat", "requirement", "17 tahun"],
    blocks: [
      {
        kind: "p",
        text: "Selamat datang di dokumentasi **Althentic.Dev** - marketplace prompt serbaguna yang bersifat **multi-tenant**: setiap penjual (seller) memiliki toko sendiri dengan slug unik, QR pembayaran pribadi, dan produk yang dikelola mandiri, sementara pembeli (buyer) dapat membeli prompt, template jadi, hingga bundle lengkap untuk kebutuhan website, riset, belajar, konten, dan desain.",
      },
      {
        kind: "p",
        text: "Transaksi berjalan dengan transfer manual melalui QR bisnis milik seller, lalu bukti transfer diverifikasi oleh AI (atau manual oleh seller). Setelah order berstatus **Lunas**, file dapat diunduh langsung dari halaman **Koleksi Saya** - tanpa redirect ke layanan pihak ketiga.",
      },
      { kind: "h2", text: "Tiga langkah untuk mulai" },
      {
        kind: "steps",
        items: [
          {
            title: "Jelajahi katalog",
            text: "Buka **Katalog Prompt**, lalu filter berdasarkan kategori (Website, Riset, Belajar/Edukasi, Konten & Copywriting, Desain, Lain-lain), tipe jual, rentang harga, atau rating. Untuk produk **Template Jadi** dan **Bundle**, coba dulu live demo-nya sebelum membeli.",
          },
          {
            title: "Buat akun gratis",
            text: "Daftar memakai email aktif atau akun Google. Verifikasi email cukup dilakukan sekali dan wajib sebelum checkout pertama. Satu akun yang sama dapat berperan sebagai buyer maupun seller.",
          },
          {
            title: "Beli dan eksekusi",
            text: "Pilih tipe jual pada halaman produk, selesaikan checkout, lalu bayar dan unggah bukti transfer. Begitu status menjadi **Lunas**, unduh filenya dan eksekusi prompt ke AI tool favoritmu - Gemini, ChatGPT, Claude, atau lainnya.",
          },
        ],
      },
      {
        kind: "links",
        items: [
          { label: "Katalog Prompt", desc: "Jelajahi semua produk yang sedang dijual.", to: { v: "catalog" }, reset: true },
          { label: "Prompt Generator", desc: "Susun prompt 7 blok secara gratis.", to: { v: "generator" } },
          { label: "Panduan Buyer", desc: "Alur beli, bayar, unduh, dan review.", to: { v: "docs", tab: "buyer" } },
          { label: "Panduan Seller", desc: "Buka toko dan kelola produkmu.", to: { v: "docs", tab: "seller" } },
        ],
      },
      {
        kind: "callout",
        tone: "info",
        title: "Yang kamu butuhkan",
        text: "Hanya dua hal: **email aktif** (atau akun Google) dan usia minimal **17 tahun**. Tidak ada biaya pendaftaran - akun buyer gratis selamanya; seller hanya dikenakan komisi kecil per transaksi sukses.",
      },
    ],
  },

  // ------------------------------------------------------------------- 2. Buyer
  {
    id: "buyer",
    num: 2,
    title: "Panduan Buyer",
    subtitle:
      "Alur lengkap membeli, membayar, mengunduh, mengeksekusi prompt, hingga memberi review dan mengajukan dispute.",
    icon: "shopping-bag",
    keywords: ["beli", "bayar", "qr", "bukti transfer", "upload", "status order", "lunas", "booked", "download", "koleksi", "kuota", "review", "dispute", "refund", "eksekusi prompt"],
    blocks: [
      {
        kind: "p",
        text: "Sebagai buyer, perjalananmu terdiri dari enam tahap: membeli, membayar, memantau status, mengunduh, mengeksekusi, lalu menilai. Halaman ini merinci setiap tahap beserta aturan mainnya agar tidak ada kejutan.",
      },
      { kind: "h2", text: "1. Membeli produk" },
      {
        kind: "steps",
        items: [
          {
            title: "Pilih produk",
            text: "Dari katalog atau halaman toko, buka halaman produk. Baca deskripsi, telusuri preview (maksimal 5 gambar), dan untuk tipe Template/Bundle coba **live demo**-nya langsung.",
          },
          {
            title: "Pilih tipe jual",
            text: "Satu produk bisa dijual dalam beberapa tipe - **Template Jadi**, **Prompt saja**, atau **Bundle** - masing-masing dengan harga berbeda. Pilih yang paling sesuai kebutuhan dan budgetmu.",
          },
          {
            title: "Checkout",
            text: "Checkout membutuhkan akun yang sudah **terverifikasi emailnya**. Order dibuat dengan status **Menunggu Pembayaran** dan berlaku **24 jam** sejak checkout dimulai.",
          },
        ],
      },
      { kind: "h2", text: "2. Membayar dan mengunggah bukti" },
      {
        kind: "p",
        text: "Tekan tombol **Bayar Sekarang** untuk memulai sesi pembayaran. Sistem menampilkan **QR bisnis milik seller** - scan dengan aplikasi bank atau e-wallet, transfer sesuai jumlah tepat, lalu unggah bukti transfernya.",
      },
      {
        kind: "list",
        items: [
          "Format bukti: **JPG, PNG, atau HEIC** dengan ukuran maksimal **5 MB**.",
          "Pratinjau gambar muncul sebelum dikirim - pastikan screenshot jelas dan memuat nominal, nama pengirim, serta waktu transfer.",
          "Satu order membutuhkan **satu bukti unik** - bukti yang pernah dipakai order lain akan ditolak sebagai duplikat.",
        ],
      },
      { kind: "h2", text: "3. Memahami status order" },
      {
        kind: "timeline",
        items: [
          {
            label: "Menunggu Pembayaran",
            text: "Order dibuat dan QR seller ditampilkan. Order berlaku 24 jam; bila lewat tanpa pembayaran valid, status berubah menjadi Kedaluwarsa.",
            tone: "warn",
          },
          {
            label: "Menunggu Verifikasi",
            text: "Bukti transfer sudah diunggah dan sedang diperiksa AI pilihan seller - biasanya selesai dalam hitungan menit.",
            tone: "info",
          },
          {
            label: "Booked (jalur manual)",
            text: "Terjadi bila seller belum memasang API key atau verifikasi AI gagal berulang - seller memeriksa buktimu secara manual. Order tetap berjalan, hanya lebih lambat.",
            tone: "info",
          },
          {
            label: "Lunas",
            text: "Pembayaran terverifikasi. File dapat diunduh dari **Koleksi Saya** dan review dapat diberikan.",
            tone: "ok",
          },
          {
            label: "Dibatalkan",
            text: "Order dibatalkan sebelum lunas - olehmu sendiri atau karena verifikasi gagal berulang.",
            tone: "muted",
          },
          {
            label: "Kedaluwarsa",
            text: "24 jam berlalu tanpa bukti yang valid. Buat order baru dari halaman produk bila masih ingin membeli.",
            tone: "bad",
          },
        ],
      },
      { kind: "h2", text: "4. Mengunduh file" },
      {
        kind: "p",
        text: "Setelah order berstatus **Lunas**, buka halaman **Koleksi Saya** dan tekan tombol unduh. File terunduh langsung dari server Althentic - **tanpa redirect ke Google Drive** - sehingga link sumber seller tidak pernah terekspos.",
      },
      {
        kind: "callout",
        tone: "warning",
        title: "Kuota unduh 1x tanpa reset",
        text: "Kuota unduh bersifat **satu kali** dan tidak dapat direset - sesuai lisensi personal satu pengguna. Segera simpan salinan di penyimpanan aman (cloud pribadi atau harddisk). Bila file bermasalah atau hilang sebelum sempat disimpan, ajukan dispute dalam **7 hari** setelah order selesai.",
      },
      { kind: "h2", text: "5. Eksekusi prompt ke AI tool" },
      {
        kind: "steps",
        items: [
          {
            title: "Salin prompt",
            text: "Buka file hasil unduhan, lalu salin seluruh isi prompt atau blok tertentu yang kamu butuhkan.",
          },
          {
            title: "Tempel ke AI tool",
            text: "Gunakan Gemini, ChatGPT, Claude, atau AI tool lain yang kamu langgani - prompt di Althentic tidak terikat provider tertentu.",
          },
          {
            title: "Isi blok konteks",
            text: "Ganti bagian yang ditandai sebagai konteks - misalnya nama brand, target audiens, data pasar - dengan datamu sendiri. Semakin spesifik konteks, semakin tajam output.",
          },
          {
            title: "Iterasi",
            text: "Jika hasil belum pas, minta AI merevisi bagian tertentu saja alih-alih menulis ulang seluruh prompt - lebih cepat dan hasilnya lebih konsisten.",
          },
        ],
      },
      { kind: "h2", text: "6. Review dan dispute" },
      {
        kind: "p",
        text: "Review hanya dapat diberikan untuk order berstatus **Lunas** - maksimal **satu review per pembelian** dengan jendela edit **7 hari** setelah dikirim. Penilaian jujurmu membantu buyer lain menakar kualitas produk.",
      },
      {
        kind: "p",
        text: "Bila terjadi masalah - file tidak bisa diakses, isi berbeda drastis dari deskripsi, atau seller tidak merespons - ajukan **dispute paling lambat 7 hari setelah order selesai**. Tim kami menengahi berdasarkan bukti dari kedua pihak; rincian kriteria refund ada di bagian Kebijakan Marketplace.",
      },
    ],
  },

  // ------------------------------------------------------------------ 3. Seller
  {
    id: "seller",
    num: 3,
    title: "Panduan Seller",
    subtitle:
      "Buka toko, unggah produk, lolos verifikasi, kelola komisi, dan baca performa toko dari analytics.",
    icon: "store",
    keywords: ["toko", "onboarding", "slug", "qr", "api key", "upload produk", "preview", "zip", "google drive", "live demo", "verifikasi", "inspeksi", "komisi", "invoice", "analytics", "dashboard"],
    blocks: [
      {
        kind: "p",
        text: "Seller di Althentic.Dev memegang kendali penuh atas tokonya: nama, slug, aksen warna, QR pembayaran, hingga katalog produk. Platform yang menangani verifikasi pembayaran otomatis, pengiriman file, pencatatan komisi, dan proteksi link sumber.",
      },
      { kind: "h2", text: "Membuka toko - onboarding 4 langkah" },
      {
        kind: "steps",
        items: [
          {
            title: "Profil dan slug toko",
            text: "Isi nama toko, deskripsi, dan pilih slug. Slug bersifat **permanen dan tidak bisa diganti** setelah toko dipublikasikan - pilih dengan hati-hati karena menjadi alamat tokomu.",
          },
          {
            title: "QR bisnis dan pernyataan",
            text: "Unggah QR bisnis (JPG/PNG maks 2 MB) yang akan menerima semua pembayaran ordermu, lalu setujui pernyataan bahwa QR **sudah diuji** dan terbukti menerima transfer.",
          },
          {
            title: "API key (semi-opsional)",
            text: "Tempel AI API key untuk verifikasi bukti otomatis. **Tanpa key, semua order harus kamu approve manual** - lebih lambat bagi buyer dan memicu status Booked.",
          },
          {
            title: "Produk pertama (opsional)",
            text: "Toko bisa langsung live tanpa produk. Unggah produk pertama kapan saja dari dashboard seller - panduan lengkapnya ada di blok berikutnya.",
          },
        ],
      },
      { kind: "h2", text: "Mengunggah produk" },
      {
        kind: "list",
        items: [
          "**Preview**: maksimal **5 gambar** (JPG/PNG/WebP, masing-masing maks 5 MB) - tampilkan hasil nyata produk, bukan mockup yang menyesatkan.",
          "**File ZIP**: diserahkan melalui **link Google Drive publik** - platform memvalidasi isinya dan men-stream file ke buyer tanpa mengekspos link mentah.",
          "**Live demo wajib** untuk tipe **Template Jadi** dan **Bundle** - harus dapat diakses publik pada saat inspeksi.",
          "**Kategori Website** boleh memakai ketiga tipe jual (Template Jadi, Prompt, Bundle); **kategori lain hanya boleh Prompt saja**.",
        ],
      },
      { kind: "h2", text: "Proses verifikasi produk" },
      {
        kind: "p",
        text: "Setiap produk melewati dua lapis pemeriksaan: **inspeksi otomatis** (link Drive hidup, ZIP valid, live demo merespons) lalu **review Super-Admin** untuk legalitas dan keamanan materi - bukan untuk menilai kualitas isi.",
      },
      {
        kind: "p",
        text: "Produk yang ditolak menerima alasan lengkap beserta laporan inspeksi, dan kamu punya **14 hari** untuk memperbaiki dan mengajukan ulang sebelum produk dianggap hangus.",
      },
      { kind: "h2", text: "Komisi, invoice, dan tangga pembayaran" },
      {
        kind: "table",
        head: ["Tahap", "Aturan"],
        rows: [
          ["Komisi flat", "**Rp1.000 per transaksi terverifikasi** - tercatat ke ledger **Commission Owed** begitu order Lunas."],
          ["Invoice otomatis", "Terbit saat Commission Owed melewati threshold **Rp25.000**."],
          ["Grace period", "**7 hari** sejak invoice terbit untuk menyelesaikan pembayaran komisi."],
          ["Suspend", "Mulai **hari ke-8** tanpa pembayaran - toko tidak bisa menerima order baru."],
          ["Verifikasi pembayaran", "Bukti bayar komisi diverifikasi **manual oleh Super-Admin** sebelum status invoice berubah lunas."],
        ],
      },
      { kind: "h2", text: "Analytics toko" },
      {
        kind: "p",
        text: "Dashboard seller menyediakan ringkasan transaksi terverifikasi, pendapatan kotor, komisi terutang, produk terlaris, dan grafik transaksi harian - cukup untuk memantau kesehatan toko tanpa spreadsheet tambahan.",
      },
    ],
  },

  // ------------------------------------------------------------ 4. Konsep & Istilah
  {
    id: "konsep",
    num: 4,
    title: "Konsep & Istilah",
    subtitle:
      "Kamus ringkas prompt engineering dan istilah platform yang akan sering kamu temui di seluruh dokumentasi.",
    icon: "book-open",
    keywords: ["istilah", "kosakata", "prompt engineering", "blok prompt", "peran", "tugas", "konteks", "format output", "batasan", "tone", "template", "bundle", "booked", "commission owed", "threshold", "verifikasi", "re-inspeksi", "self-buy", "dispute", "deploy", "live demo"],
    blocks: [
      {
        kind: "p",
        text: "Dokumentasi ini memakai istilah teknis yang kadang membingungkan bagi pemula. Bagian berikut merangkum konsep inti prompt engineering serta istilah spesifik platform - jadikan rujukan cepat kapan pun kamu lupa.",
      },
      { kind: "h2", text: "Apa itu prompt?" },
      {
        kind: "p",
        text: "Prompt adalah instruksi tertulis yang kamu berikan kepada AI untuk menghasilkan output - bisa berupa teks, kode, tabel, atau strategi. Prompt yang baik **tidak mengandalkan keberuntungan**: ia menyusun peran, tugas, konteks, dan batasan secara eksplisit sehingga AI tahu persis apa yang harus dikerjakan dan dalam bentuk apa hasilnya disajikan.",
      },
      { kind: "h2", text: "Tujuh blok prompt" },
      {
        kind: "table",
        head: ["Blok", "Fungsi"],
        rows: [
          ["Peran (Role)", "Menentukan persona AI - misalnya \u201ckonsultan bisnis ritel berpengalaman 10 tahun\u201d."],
          ["Tugas (Task)", "Satu kalimat perintah inti yang harus diselesaikan AI."],
          ["Konteks", "Data pendukung: brand, target pasar, angka, dan kendala nyata yang memengaruhi jawaban."],
          ["Format Output", "Bentuk hasil yang diminta: laporan 5 bagian, tabel, JSON, atau kerangka presentasi."],
          ["Batasan (Constraints)", "Aturan main: panjang maksimal, hal yang dilarang, standar yang wajib dipatuhi."],
          ["Contoh (Examples)", "Sampel output yang diinginkan agar AI meniru pola dan gayanya."],
          ["Tone / Gaya", "Nuansa bahasa: formal, santai, persuasif, atau teknis."],
        ],
      },
      { kind: "h2", text: "Istilah platform" },
      {
        kind: "kv",
        items: [
          { term: "Template Jadi", def: "File siap pakai yang tinggal dieksekusi atau di-customize - **wajib memiliki live demo** sebelum dijual." },
          { term: "Prompt saja", def: "Prompt terstruktur siap tempel ke AI tool - tanpa file pendamping." },
          { term: "Bundle", def: "Paket **Template Jadi + Prompt pendamping** dalam satu produk." },
          { term: "Booked", def: "Status order yang diverifikasi **manual oleh seller** (bukan AI) - misalnya saat API key belum dipasang." },
          { term: "Commission Owed", def: "Saldo komisi platform yang masih terutang oleh seller, terkumpul per transaksi Lunas." },
          { term: "Threshold", def: "Ambang Commission Owed yang memicu invoice otomatis - saat ini **Rp25.000**." },
          { term: "Verifikasi", def: "Proses pemeriksaan bukti transfer (AI atau manual) maupun review produk sebelum dipublikasikan." },
          { term: "Re-inspeksi", def: "Pemeriksaan ulang berkala terhadap produk aktif - misalnya mendeteksi link Drive atau live demo yang mati." },
          { term: "Self-buy flag", def: "Penanda bahwa order dibeli oleh pemilik toko sendiri - tidak dihitung dalam penjualan, rating, maupun analytics." },
          { term: "Dispute", def: "Sengketa formal buyer–seller yang dimitigasi platform, dengan batas waktu **7 hari** setelah order selesai." },
        ],
      },
      { kind: "h2", text: "Istilah teknis kategori Website" },
      {
        kind: "kv",
        items: [
          { term: "Template", def: "Kerangka website siap pakai (HTML/CSS/JS atau framework) yang tinggal diisi konten dan branding." },
          { term: "Live demo", def: "Versi online dari template yang dapat dilihat calon buyer sebelum membeli." },
          { term: "Deploy", def: "Proses mempublikasikan website ke internet - misalnya via Vercel, Netlify, atau hosting milik sendiri." },
        ],
      },
    ],
  },

  // ----------------------------------------------------------------- 5. Tutorial
  {
    id: "tutorial",
    num: 5,
    title: "Tutorial",
    subtitle:
      "Dua studi kasus nyata langkah demi langkah - dari membeli produk sampai landing page ter-deploy dan laporan riset jadi.",
    icon: "graduation-cap",
    keywords: ["tutorial", "guide", "langkah", "landing page", "website", "deploy", "riset pasar", "laporan", "studi kasus", "praktik"],
    blocks: [
      {
        kind: "p",
        text: "Teori sudah cukup - sekarang praktik. Dua tutorial berikut memakai pola produk yang tersedia di kategori **Website** dan **Riset**, dan dapat diikuti berurutan tanpa pengalaman teknis mendalam.",
      },
      { kind: "h2", text: "Tutorial A - Membangun landing page dari produk kategori Website" },
      {
        kind: "steps",
        items: [
          {
            title: "Pilih bundle di katalog",
            text: "Filter kategori **Website** dengan tipe **Bundle**. Buka halaman produk, coba live demo-nya, baca review terbaru, lalu lanjutkan ke checkout.",
          },
          {
            title: "Bayar dan tunggu Lunas",
            text: "Scan QR seller, transfer sesuai jumlah, lalu unggah bukti. Verifikasi AI biasanya selesai dalam hitungan menit - pantau di halaman Orders.",
          },
          {
            title: "Unduh ZIP dari Koleksi Saya",
            text: "Ekstrak arsipnya. Di dalamnya terdapat folder template dan file **prompt pendamping** (README atau berkas teks terstruktur). Simpan salinan aman - kuota unduh hanya 1x.",
          },
          {
            title: "Baca prompt pendamping",
            text: "Prompt ini berisi arsitektur halaman dan kerangka copywriting landing page. Salin bagian yang relevan dengan section yang ingin kamu bangun.",
          },
          {
            title: "Eksekusi prompt dengan konteksmu",
            text: "Isi blok Konteks: nama usaha, produk/jasa, target audiens, dan keunggulan kompetitifmu. Tempel ke AI tool untuk menghasilkan copy dan rekomendasi penyesuaian section.",
          },
          {
            title: "Deploy",
            text: "Unggah folder template yang sudah kamu edit ke Vercel/Netlify (drag-and-drop cukup) atau hosting milikmu - landing page siap dibagikan ke calon pelanggan.",
          },
        ],
      },
      { kind: "h2", text: "Tutorial B - Riset pasar untuk ide bisnis" },
      {
        kind: "steps",
        items: [
          {
            title: "Pilih prompt riset",
            text: "Filter kategori **Riset**, lalu pilih prompt analisis pasar yang paling sesuai target bisnismu - cek preview dan rating dulu.",
          },
          {
            title: "Beli prompt-nya",
            text: "Tipe **Prompt saja** biasanya cukup - tidak butuh file pendamping. Selesaikan checkout dan pembayaran seperti biasa.",
          },
          {
            title: "Buka file prompt",
            text: "Unduh dari **Koleksi Saya** lalu buka file prompt terstruktur di editor teks favoritmu.",
          },
          {
            title: "Isi blok Konteks",
            text: "Tuliskan ide bisnis, segmen target, asumsi harga, dan kompetitor yang sudah kamu ketahui - bagian ini yang menentukan kedalaman analisis.",
          },
          {
            title: "Generate laporan",
            text: "Tempel ke AI tool. Prompt akan meminta output laporan terstruktur; lengkapi bila AI menanyakan detail tambahan di tengah proses.",
          },
          {
            title: "Iterasi dan arsipkan",
            text: "Minta pendalaman pada bagian tertentu (misalnya analisis kompetitor atau proyeksi harga), lalu simpan laporan final sebagai bahan keputusan bisnis.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "success",
        title: "Kunci hasil yang bagus",
        text: "Output AI sangat bergantung pada **blok Konteks** yang kamu isi. Dua kalimat konteks menghasilkan laporan generik; satu paragraf data nyata menghasilkan analisis yang tajam dan langsung terpakai.",
      },
    ],
  },

  // --------------------------------------------------------------------- 6. FAQ
  {
    id: "faq",
    num: 6,
    title: "FAQ Teknis",
    subtitle: "Jawaban atas pertanyaan teknis yang paling sering masuk ke tim support.",
    icon: "circle-help",
    keywords: ["faq", "pertanyaan", "bukti ditolak", "kurang bayar", "duplikat", "timestamp", "booked", "fallback key", "download 1x", "drive mati", "unlist", "notifikasi update", "kedaluwarsa", "self buy"],
    blocks: [
      {
        kind: "p",
        text: "Tidak menemukan jawabanmu? Coba kotak pencarian di sidebar, atau buka bagian **Troubleshooting** untuk tabel masalah → penyebab → solusi yang lebih lengkap.",
      },
      {
        kind: "faq",
        items: [
          {
            q: "Kenapa bukti transfer saya ditolak dengan alasan \u201ckurang bayar\u201d?",
            a: [
              "AI membaca nominal pada bukti dan menemukannya **lebih kecil dari tagihan order**. Transfer harus sesuai jumlah tepat - periksa kembali total di halaman pembayaran sebelum mengirim.",
              "Lakukan transfer baru dengan nominal yang benar, lalu unggah bukti pengganti. Order tetap berlaku selama belum melewati masa 24 jam.",
            ],
          },
          {
            q: "Kenapa alasan penolakan berbunyi \u201cduplikat\u201d?",
            a: [
              "Bukti yang sama pernah dipakai pada order lain - satu order membutuhkan satu bukti unik.",
              "Ambil screenshot baru dari riwayat mutasi (jangan memakai file lama) dan unggah kembali dari halaman order yang sama.",
            ],
          },
          {
            q: "Apa arti \u201ctimestamp di luar sesi\u201d?",
            a: [
              "Waktu transfer yang terbaca pada bukti berada di luar jendela sesi pembayaran aktif.",
              "Pastikan kamu transfer **setelah menekan Bayar Sekarang** dan sebelum order kedaluwarsa (24 jam), lalu unggah bukti dari transaksi tersebut.",
            ],
          },
          {
            q: "Kenapa order saya berstatus Booked, bukan Menunggu Verifikasi?",
            a: [
              "Booked berarti order berada di **jalur verifikasi manual** - terjadi bila seller belum memasang API key, key-nya bermasalah, atau verifikasi AI gagal berulang.",
              "Seller akan memeriksa buktimu sendiri, biasanya dalam hitungan jam kerja. Kamu tidak perlu melakukan apa pun selain menunggu notifikasi.",
            ],
          },
          {
            q: "Apa itu fallback key?",
            a: [
              "Fallback key adalah **AI API key cadangan** yang dipakai otomatis ketika primary key error, kehabisan kuota, atau gagal 3x berturut-turut.",
              "Praktik terbaik: primary dan fallback berasal dari provider berbeda agar tidak tumbang bersamaan.",
            ],
          },
          {
            q: "Kenapa kuota unduh hanya satu kali?",
            a: [
              "Kuota 1x melindungi lisensi **personal dan anti-resell** - satu pembelian untuk satu pengguna.",
              "Simpan file di penyimpanan aman segera setelah mengunduh. Bila file bermasalah saat diunduh atau hilang sebelum tersimpan, ajukan dispute dalam 7 hari setelah order selesai.",
            ],
          },
          {
            q: "Apa yang terjadi kalau link Google Drive seller mati?",
            a: [
              "Re-inspeksi mingguan mendeteksi link yang mati; produk otomatis **di-unlist maksimal 72 jam** sambil menunggu seller memperbaiki.",
              "Bagi pembeli yang ordernya sudah Lunas namun gagal mengunduh karena masalah ini, jalur dispute tersedia sebagai solusi penggantian atau refund.",
            ],
          },
          {
            q: "Bagaimana notifikasi update produk bekerja?",
            a: [
              "Notifikasi update terkirim **hanya ketika ZIP inti berubah** (terdeteksi dari hash file) - misalnya seller memperbaiki bug template.",
              "Perubahan deskripsi, preview, atau harga **tidak** memicu notifikasi agar pesan yang kamu terima tetap relevan dan tidak berisik.",
            ],
          },
          {
            q: "Saya seller - bolehkah membeli produk sendiri untuk uji coba?",
            a: [
              "Boleh untuk menguji alur pembelian, namun order akan ditandai **self-buy flag**.",
              "Order tersebut tidak dihitung dalam penjualan, rating, maupun analytics toko - jadi metrik performamu tetap jujur.",
            ],
          },
          {
            q: "Kapan order saya berubah menjadi Kedaluwarsa?",
            a: [
              "Order berlaku **24 jam sejak checkout dimulai**. Jika tidak ada pembayaran valid dalam jangka waktu itu, status berubah menjadi Kedaluwarsa secara otomatis.",
              "Bila masih ingin membeli, buat order baru dari halaman produk - QR dan sesi pembayaran akan diterbitkan ulang.",
            ],
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------- 7. Changelog
  {
    id: "changelog",
    num: 7,
    title: "Changelog",
    subtitle: "Riwayat rilis platform - fitur baru, perbaikan bug, dan perubahan penting lainnya.",
    icon: "git-branch",
    keywords: ["changelog", "release", "versi", "update", "riwayat", "github", "webhook"],
    blocks: [
      {
        kind: "p",
        text: "Setiap rilis platform tercatat di halaman ini. Entri diurutkan dari yang terbaru; tag menunjukkan nomor versi rilis, dan tautan GitHub membawamu langsung ke detail rilisnya.",
      },
    ],
    special: "changelog",
  },

  // ------------------------------------------------------------------ 8. API Key
  {
    id: "api-key",
    num: 8,
    title: "API Key & AI Model Setup",
    subtitle:
      "Panduan menyiapkan AI API key untuk verifikasi pembayaran otomatis di tokomu - dari Google AI Studio sampai rotasi key.",
    icon: "key-round",
    keywords: ["api key", "gemini", "google ai studio", "byok", "enkripsi", "aes-256-gcm", "mask", "fallback", "rotasi", "provider", "tanpa key", "manual", "settings toko"],
    blocks: [
      {
        kind: "p",
        text: "Althentic memakai model **BYOK (Bring Your Own Key)**: verifikasi bukti transfer dijalankan pada AI pilihanmu sendiri, dengan key yang sepenuhnya kamu pegang - platform hanya menyimpan versi terenkripsi dan tidak pernah membaca nilai aslinya kembali.",
      },
      { kind: "h2", text: "Menyiapkan Gemini (Google AI Studio)" },
      {
        kind: "steps",
        items: [
          {
            title: "Buat key",
            text: "Kunjungi **Google AI Studio**, masuk dengan akun Google, buka halaman API key, lalu klik **Create API key**. Kuota dasar tersedia gratis.",
          },
          {
            title: "Salin key",
            text: "Key berformat `AIza...` - salin ke clipboard. Perlakukan seperti kata sandi: jangan pernah dibagikan.",
          },
          {
            title: "Tempel di Settings Toko",
            text: "Buka dashboard seller → **Settings**. Pilih provider **Gemini** pada dropdown, lalu tempel key ke kolom **Primary key**.",
          },
          {
            title: "Isi fallback key (disarankan)",
            text: "Tempel key kedua ke kolom **Fallback key** - dipakai otomatis bila primary gagal. Idealnya berasal dari provider berbeda.",
          },
          {
            title: "Simpan",
            text: "Tekan simpan - key langsung dienkripsi dan aktif digunakan pada order berikutnya.",
          },
        ],
      },
      { kind: "h2", text: "Bagaimana key-mu disimpan" },
      {
        kind: "list",
        items: [
          "Key dienkripsi dengan **AES-256-GCM** sebelum disimpan - tidak ada yang bisa membaca nilai aslinya dari database.",
          "Setelah disimpan, key hanya tampil **ter-mask** (misalnya `AIza...9f2c`) - nilai lengkapnya tidak pernah ditampilkan lagi.",
          "Rotasi kapan saja lewat tombol **Ganti key** - key lama langsung nonaktif begitu key baru disimpan.",
          "Bila verifikasi AI gagal **3x berturut-turut**, kamu menerima email pengingat untuk memeriksa key yang dipasang.",
        ],
      },
      { kind: "h2", text: "Provider alternatif" },
      {
        kind: "p",
        text: "Dropdown provider memungkinkanmu memilih mesin verifikasi selain Gemini - misalnya provider vision lain yang kamu langgani. Polanya identik: pilih provider, tempel primary + fallback key, simpan. Kamu dapat berganti provider kapan saja tanpa migrasi data.",
      },
      { kind: "h2", text: "Mode tanpa key (verifikasi manual)" },
      {
        kind: "p",
        text: "Toko tetap bisa beroperasi **tanpa API key** - semua bukti transfer masuk jalur manual dan tampil sebagai status **Booked** bagi buyer. Kamu memverifikasi sendiri melalui **3 langkah checklist** di halaman order: buka detail order, cocokkan bukti dengan QR & nominal, lalu approve atau tolak.",
      },
      {
        kind: "callout",
        tone: "warning",
        title: "Jaga kerahasiaan key",
        text: "API key adalah akses berbayar ke akun AI-mu. Jangan pernah membagikannya ke siapa pun - tim Althentic **tidak akan pernah meminta nilai lengkap key-mu** setelah tersimpan.",
      },
    ],
  },

  // ---------------------------------------------------------- 9. Troubleshooting
  {
    id: "troubleshooting",
    num: 9,
    title: "Troubleshooting",
    subtitle: "Tabel masalah umum, penyebab, dan solusi cepat yang bisa kamu lakukan sendiri.",
    icon: "wrench",
    keywords: ["masalah", "error", "gagal", "ditolak", "kedaluwarsa", "kuota habis", "demo mati", "inspeksi", "invoice", "logout", "solusi", "perbaikan"],
    blocks: [
      {
        kind: "p",
        text: "Sebagian besar masalah bisa diselesaikan sendiri dalam hitungan menit. Temukan gejalanya di kolom pertama; bila tetap terkendala setelah mencoba solusinya, ajukan dispute (masalah transaksi) atau lapor produk (masalah katalog).",
      },
      {
        kind: "table",
        head: ["Masalah", "Penyebab", "Solusi"],
        rows: [
          ["Bukti transfer ditolak", "Nominal tidak cocok, bukti duplikat, atau timestamp di luar sesi.", "Baca alasan penolakan, lakukan transfer baru yang sesuai, lalu unggah bukti segar sebelum 24 jam."],
          ["Order berubah jadi Kedaluwarsa", "24 jam berlalu sejak checkout tanpa pembayaran valid.", "Buat order baru dari halaman produk - QR dan sesi diterbitkan ulang."],
          ["Tombol unduh nonaktif", "Kuota unduh 1x sudah terpakai pada order tersebut.", "Simpan file sejak awal. Bila file bermasalah, ajukan dispute maksimal 7 hari setelah order selesai."],
          ["Live demo produk mati", "Seller mengubah atau menghapus demo setelah produk live.", "Laporkan produk melalui tombol lapor - re-inspeksi mingguan akan menangani dan meng-unlist bila tidak diperbaiki."],
          ["Produk ditolak inspeksi", "Link Drive tidak publik, ZIP tidak valid, atau materi berisiko.", "Perbaiki sesuai laporan inspeksi lalu ajukan ulang dalam 14 hari."],
          ["Invoice komisi mendadak muncul", "Commission Owed melewati threshold Rp25.000.", "Bayar sebelum jatuh tempo 7 hari agar toko tidak tersuspend pada hari ke-8."],
          ["Sering logout sendiri", "Sesi sensitif berumur 1 hari; mode remember-me 30 hari.", "Masuk kembali dan centang opsi ingat saya bila perangkatnya milikmu sendiri."],
        ],
      },
    ],
  },

  // ----------------------------------------------------------------- 10. Policy
  {
    id: "policy",
    num: 10,
    title: "Kebijakan Marketplace",
    subtitle: "Standar konten, kriteria verifikasi, tangga sanksi, lisensi buyer, dan aturan refund.",
    icon: "scale",
    keywords: ["kebijakan", "policy", "standar konten", "ilegal", "plagiarisme", "menyesatkan", "sanksi", "banned", "lisensi", "resell", "refund", "takedown"],
    blocks: [
      { kind: "h2", text: "Standar konten" },
      {
        kind: "list",
        items: [
          "**Ilegal** - produk yang melanggar hukum Indonesia dilarang keras: cracking, carding, konten dewasa tanpa verifikasi usia, atau jasa yang memfasilitasi kejahatan.",
          "**Plagiarisme antar produk katalog** - menyalin produk seller lain (prompt, template, preview) tanpa izin akan diturunkan dari katalog.",
          "**Menyesatkan** - deskripsi, preview, atau live demo yang berbeda drastis dari isi file sebenarnya.",
        ],
      },
      { kind: "h2", text: "Kriteria verifikasi" },
      {
        kind: "p",
        text: "Verifikasi produk menilai **legalitas dan keamanan saja - bukan kualitas isi**. Selama link hidup, file valid, demo merespons, dan deskripsi tidak menipu, produk berhak live. Kualitas akhir biar pasar yang menilai - lewat review dan rating buyer.",
      },
      { kind: "h2", text: "Tangga sanksi" },
      {
        kind: "timeline",
        items: [
          { label: "Peringatan email", text: "Pelanggaran ringan pertama - berisi penjelasan pelanggaran dan permintaan perbaikan dalam tenggat tertentu.", tone: "warn" },
          { label: "Suspend listing 7 hari", text: "Produk pelanggaran disembunyikan dari katalog sementara hingga diperbaiki dan lulus re-inspeksi.", tone: "warn" },
          { label: "Suspend toko", text: "Pelanggaran berulang - seluruh produk tidak bisa dijual dan toko tidak menerima order hingga masalah diselesaikan.", tone: "bad" },
          { label: "Banned permanen", text: "Fraud, penipuan pembayaran, atau pelanggaran berat lain - akun dan tokonya dihapus dari platform selamanya.", tone: "bad" },
        ],
      },
      { kind: "h2", text: "Lisensi buyer" },
      {
        kind: "p",
        text: "Pembelian memberimu lisensi **personal dan komersial atas OUTPUT** - bebas memakai hasil prompt atau template untuk proyek klien, bisnis, atau kontenmu. Yang tidak boleh: **resell file mentah** (prompt, template, ZIP) apa adanya di platform mana pun, termasuk di Althentic sendiri.",
      },
      { kind: "h2", text: "Refund" },
      {
        kind: "p",
        text: "Refund didukung bila **file tidak bisa diakses**, **isi berbeda drastis dari deskripsi**, atau **seller tidak respons dalam 48 jam** sejak dispute dibuka. Refund tidak berlaku untuk alasan selera - \u201ckurang cocok dengan ekspektasi\u201d sebaiknya dicek lewat live demo, preview, dan review terlebih dahulu sebelum membeli.",
      },
    ],
  },

  // ---------------------------------------------------------------- 11. Security
  {
    id: "security",
    num: 11,
    title: "Keamanan & Privasi Transaksi",
    subtitle: "Bagaimana bukti pembayaran, file digital, dan data transaksimu diperlakukan di Althentic.Dev.",
    icon: "shield-check",
    keywords: ["keamanan", "privasi", "bukti transfer", "ai pihak ketiga", "byok", "retensi", "30 hari", "90 hari", "proxy", "content disposition", "signed url", "rate limit", "akses data", "soft delete"],
    blocks: [
      {
        kind: "p",
        text: "Prinsip kami sederhana: platform hanya menyimpan data yang diperlukan, selama diperlukan, dan sebisa mungkin tidak menyimpan rahasia milik pihak lain. Berikut rinciannya.",
      },
      { kind: "h2", text: "Bukti transfer dan AI pihak ketiga" },
      {
        kind: "p",
        text: "Verifikasi bukti dijalankan oleh **AI pilihan seller (BYOK)** - data gambar dikirim langsung dari server kami ke penyedia AI tersebut. **Althentic tidak menyimpan salinan hasil proses AI**; yang tersimpan hanya ringkasan keputusan (cocok/tidak beserta alasan singkat) untuk kebutuhan audit dan dispute.",
      },
      { kind: "h2", text: "Retensi data" },
      {
        kind: "table",
        head: ["Jenis data", "Masa simpan"],
        rows: [
          ["File bukti transfer", "**30 hari** sejak verifikasi selesai, lalu dihapus permanen dari penyimpanan."],
          ["Metadata transaksi", "**90 hari** (nominal, waktu, keputusan verifikasi) untuk audit, dispute, dan kepatuhan."],
        ],
      },
      { kind: "h2", text: "Perlindungan file digital" },
      {
        kind: "list",
        items: [
          "Link Google Drive seller **tidak pernah tampil mentah** - unduhan diproxy oleh server dengan header **Content-Disposition: attachment**, sehingga file terunduh langsung tanpa membuka Drive.",
          "File privat disajikan lewat **signed URL berumur 1 jam** - tautan kedaluwarsa otomatis dan tidak dapat dipakai ulang oleh pihak lain.",
        ],
      },
      { kind: "h2", text: "Rate limit dan akses data" },
      {
        kind: "list",
        items: [
          "Endpoint sensitif dibatasi **10 request per menit** per akun/IP untuk mencegah brute-force dan scraping.",
          "**Super-Admin** memiliki akses penuh untuk audit; **seller** hanya melihat tokonya sendiri dengan data buyer yang dibatasi (nama dan kode order); **buyer** hanya melihat order miliknya sendiri.",
        ],
      },
      { kind: "h2", text: "Penghapusan akun" },
      {
        kind: "p",
        text: "Penghapusan akun bersifat **soft-delete selama 30 hari** - masa tenang untuk berlogin kembali bila berubah pikiran. Setelah itu data pribadi dihapus permanen, kecuali catatan transaksi yang wajib disimpan sesuai kebijakan retensi 90 hari.",
      },
    ],
  },

  // ----------------------------------------------------------------- 12. API/MCP
  {
    id: "api-mcp",
    num: 12,
    title: "API & MCP (Internal)",
    subtitle: "Dokumentasi endpoint MCP untuk alat bantu verifikasi internal - hanya untuk Super-Admin.",
    icon: "terminal",
    badge: "Internal",
    keywords: ["mcp", "api", "internal", "super admin", "token", "streamable http", "tools", "verifikasi", "jsonrpc"],
    blocks: [
      {
        kind: "callout",
        tone: "danger",
        title: "Internal - belum untuk publik",
        text: "Endpoint dan alur pada bagian ini hanya boleh diakses **Super-Admin**. Bagian ini sengaja tidak didokumentasikan untuk penggunaan eksternal dan dapat berubah kapan saja tanpa pemberitahuan.",
      },
      {
        kind: "p",
        text: "Althentic menyediakan endpoint **/api/mcp** dengan transport **Streamable HTTP**. Akses memakai **secret token per-session berumur 24 jam** yang diterbitkan khusus melalui dashboard admin. Endpoint ini sengaja **tidak didaftarkan di direktori MCP publik**.",
      },
      { kind: "h2", text: "Tools yang tersedia" },
      {
        kind: "table",
        head: ["Tool", "Fungsi"],
        rows: [
          ["list_pending_verifications", "Mengambil daftar produk yang menunggu verifikasi beserta metadata inspeksinya."],
          ["get_inspection_report", "Mengambil laporan inspeksi lengkap satu produk - status link Drive, HTTP live demo, ukuran ZIP."],
          ["propose_decision", "AI mengajukan **usulan** keputusan (approve/reject) beserta alasannya untuk ditinjau manusia."],
        ],
      },
      {
        kind: "code",
        label: "Contoh permintaan JSON-RPC",
        code: "POST /api/mcp\nAuthorization: Bearer <secret-token-sesi-24jam>\n\n{\n  \"jsonrpc\": \"2.0\",\n  \"id\": 1,\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"propose_decision\",\n    \"arguments\": { \"productId\": \"prd_01\", \"decision\": \"reject\" }\n  }\n}",
      },
      {
        kind: "callout",
        tone: "warning",
        title: "AI mengusulkan, manusia memutuskan",
        text: "Tool propose_decision **hanya menghasilkan usulan**. Keputusan final tetap dilakukan lewat **satu klik konfirmasi Super-Admin** di dashboard - tidak ada keputusan verifikasi yang dijalankan otomatis tanpa persetujuan manusia.",
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// Search index - teks datar per section (judul + subtitle + keyword + konten)
// -----------------------------------------------------------------------------

function blockToText(block: DocBlock): string {
  switch (block.kind) {
    case "p":
    case "h2":
      return block.text;
    case "list":
      return block.items.join(" ");
    case "steps":
      return block.items.map((i) => `${i.title} ${i.text}`).join(" ");
    case "callout":
      return `${block.title} ${block.text}`;
    case "table":
      return [block.head.join(" "), ...block.rows.map((r) => r.join(" "))].join(" ");
    case "code":
      return `${block.label ?? ""} ${block.code}`;
    case "kv":
      return block.items.map((i) => `${i.term} ${i.def}`).join(" ");
    case "timeline":
      return block.items.map((i) => `${i.label} ${i.text}`).join(" ");
    case "links":
      return block.items.map((i) => `${i.label} ${i.desc}`).join(" ");
    case "faq":
      return block.items.map((i) => `${i.q} ${i.a.join(" ")}`).join(" ");
    default:
      return "";
  }
}

export function sectionSearchText(section: DocSection): string {
  return [
    section.title,
    section.subtitle,
    section.keywords.join(" "),
    section.blocks.map(blockToText).join(" "),
  ]
    .join(" ")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .toLowerCase();
}

export const DEFAULT_DOCS_TAB = "getting-started";
