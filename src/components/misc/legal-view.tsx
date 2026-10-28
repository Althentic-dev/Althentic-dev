"use client";

// LegalView - ToS / Privacy Policy (GAP-18: naskah lengkap di-draft TERPISAH
// sebagai dokumen legal yang butuh review manual - halaman ini menampilkan
// ringkasan klausul yang SUDAH diputuskan + status drafting, bukan naskah final).
import { FileText } from "@/components/animate-ui/icons/file-text";
import { Scale } from "@/components/animate-ui/icons/scale";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { CircleAlert } from "@/components/animate-ui/icons/circle-alert";
import { useAppRouter } from "@/lib/router";

const TOS_CLAUSES: { title: string; body: string }[] = [
  {
    title: "1. Definisi & Layanan",
    body: "Althentic.Dev adalah marketplace prompt serbaguna multi-tenant. Platform menyediakan tempat jual-beli produk digital (file .zip berisi prompt/template) dengan delivery aman, verifikasi pembayaran berbantuan AI, dan pencatatan komisi. Althentic TIDAK memegang uang transaksi buyer.",
  },
  {
    title: "2. Usia Minimum (SPEC-14-05)",
    body: "Pengguna wajib berusia minimal 17 tahun dan menyatakan hal tersebut melalui checkbox saat pendaftaran.",
  },
  {
    title: "3. Akun & Persetujuan (SPEC-14-03)",
    body: "Persetujuan ToS & Privacy Policy dicatat per versi dokumen. Perubahan material memunculkan banner re-consent berisi ringkasan perubahan. Satu akun = satu toko pada fase awal; slug toko permanen.",
  },
  {
    title: "4. Lisensi Produk (SPEC-16-10)",
    body: "Buyer memperoleh lisensi penggunaan personal dan komersial atas OUTPUT prompt. Dilarang menjual ulang atau mendistribusikan file prompt mentah. Pelanggaran berujung banned permanen.",
  },
  {
    title: "5. Pembayaran & Komisi (Konteks Terkunci)",
    body: "Pembayaran buyer langsung ke QR bisnis milik seller. Komisi layanan Rp1.000 flat per transaksi terverifikasi dicatat sebagai Commission Owed dan ditagih threshold-based (invoice otomatis Rp25.000, grace 7 hari, suspend hari ke-8). Verifikasi pembayaran komisi dilakukan manual oleh Super-Admin.",
  },
  {
    title: "6. Refund & Dispute (GAP-18)",
    body: "Batas pengajuan dispute 7 hari setelah transaksi selesai. Refund didukung bila file tidak bisa diakses, isi berbeda drastis dari deskripsi, atau seller tidak merespons 48 jam; 'tidak cocok selera' bukan dasar refund. Eksekusi refund 100% manual di luar sistem - Althentic berperan sebagai mediator.",
  },
  {
    title: "7. Pajak (SPEC-14-04)",
    body: "Althentic hanya menarik komisi layanan. Seluruh kewajiban pajak atas penjualan menjadi tanggung jawab seller. Platform menyediakan ringkasan transaksi tahunan untuk membantu pembukuan.",
  },
  {
    title: "8. Hukum & Yurisdiksi (GAP-18)",
    body: "ToS tunduk pada hukum Indonesia dengan domisili hukum di Aceh Besar, Indonesia. Mediasi wajib sebelum litigasi. ToS ditulis dalam bahasa Indonesia dengan ringkasan bahasa Inggris yang tidak mengikat.",
  },
];

const PRIVACY_CLAUSES: { title: string; body: string }[] = [
  {
    title: "1. Data yang Kami Kumpulkan",
    body: "Data akun (nama, email, preferensi), data toko (slug, QR, WA, API key terenkripsi), data transaksi (order, bukti transfer terkonversi WebP, ledger komisi), dan log teknis (IP, user agent) untuk keamanan.",
  },
  {
    title: "2. Pemrosesan Bukti Transfer oleh AI (SPEC-14-01, GAP-12)",
    body: "Gambar bukti transfer diproses oleh layanan AI pihak ketiga yang dipilih seller (memakai API key milik seller - BYOK). Data dikirim langsung ke penyedia tersebut. Althentic TIDAK menyimpan salinan hasil proses AI (hanya data terstruktur: nominal, tanggal, nama pengirim, status match). File bukti dihapus fisik setelah 30 hari; metadata transaksi disimpan maksimal 90 hari untuk audit.",
  },
  {
    title: "3. Data Finansial (SPEC-14-02)",
    body: "Digolongkan sebagai data transaksi: disimpan selama akun aktif ditambah 5 tahun mengikuti kebiasaan pembukuan, dengan akses terbatas. Matriks akses: Super-Admin penuh; seller hanya transaksi tokonya (data buyer dibatasi); buyer hanya transaksinya sendiri (GAP-06).",
  },
  {
    title: "4. Keamanan (GAP-19)",
    body: "API key seller dienkripsi at-rest AES-256-GCM. File private diakses lewat signed URL berumur 1 jam. Rate limit 10 request/menit per IP+user untuk endpoint sensitif. Setiap akses download tercatat dalam log.",
  },
  {
    title: "5. Hak Pengguna",
    body: "Kamu dapat mengubah nama/email/password, mengatur preferensi email, dan menghapus akun (soft-delete 30 hari, lalu hard-delete permanen). Histori transaksi tetap tersimpan secara ter-anonymize untuk audit.",
  },
];

export function LegalView({ doc }: { doc: string }) {
  const { navigate } = useAppRouter();
  const isTos = doc !== "privacy";
  const clauses = isTos ? TOS_CLAUSES : PRIVACY_CLAUSES;

  return (
    <div className="container-page max-w-3xl py-8 md:py-12">
      {/* Toggle ToS / Privacy */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1" role="tablist">
        <button
          role="tab"
          aria-selected={isTos}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            isTos ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
          }`}
          onClick={() => navigate({ v: "legal", doc: "tos" })}
        >
          <Scale className="h-4 w-4" /> Syarat & Ketentuan
        </button>
        <button
          role="tab"
          aria-selected={!isTos}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            !isTos ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
          }`}
          onClick={() => navigate({ v: "legal", doc: "privacy" })}
        >
          <ShieldCheck className="h-4 w-4" /> Kebijakan Privasi
        </button>
      </div>

      <div className="glass-card mt-6 flex items-start gap-3 border-amber-500/40 p-4">
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <b>Status drafting:</b> naskah lengkap ToS &amp; Privacy Policy di-draft terpisah sebagai dokumen legal
          dan memerlukan review manual sebelum final (GAP-18). Halaman ini menampilkan ringkasan klausul yang
          sudah diputuskan. Versi dokumen: 2026-10-27 - persetujuanmu dicatat per versi.
        </p>
      </div>

      <article className="mt-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight md:text-3xl">
          <FileText className="h-7 w-7 text-primary" />
          {isTos ? "Syarat & Ketentuan" : "Kebijakan Privasi"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Terakhir diperbarui: 27 Oktober 2026 · Berlaku untuk seluruh pengguna Althentic.Dev
        </p>

        <div className="mt-8 space-y-6">
          {clauses.map((c) => (
            <section key={c.title}>
              <h2 className="text-base font-bold">{c.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{c.body}</p>
            </section>
          ))}
        </div>

        <div className="glass-card mt-10 p-5">
          <p className="text-sm">
            Punya pertanyaan tentang dokumen legal ini? Kirim email ke{" "}
            <span className="font-semibold text-primary">legal@althentic.dev</span> - tim kami akan merespons
            dalam 2×24 jam.
          </p>
        </div>
      </article>
    </div>
  );
}
