"use client";

// =============================================================================
// Althentic.Dev - Landing Page (Task B1, resolusi GAP-10 + Konteks Terkunci).
// 9 section: (1) Hero, (2) Value Proposition/How It Works, (3) Featured/
// Trending, (4) Kategori, (5) Social Proof, (6) Seller CTA sekunder, (7) FAQ,
// (8) placeholder pre-footer, (9) Footer - footer TIDAK dirender di sini
// (sudah global di app shell, lihat app/footer.tsx).
// REVISI DESAIN: (a) skema monokrom murni - hitam/putih/grayscale tanpa warna;
// (b) Hero TANPA background animasi - latar polos mengikuti warna dasar
// platform (#050505 dark); GradientASCII dihapus dari scope (background hero
// ditangani terpisah di luar sesi ini); (c) aset pre-footer belum tersedia →
// placeholder abu-abu solid; (d) ikon via Animate UI (lucide).
// Task R5: integrasi komponen Animate UI tambahan - CountingNumber untuk
// statistik Social Proof (S5) dan RippleButton untuk CTA utama hero (S1) +
// CTA "Buka Toko Gratis" (S6). Ripple memakai currentColor (grayscale,
// adaptif dua tema); scale hover/tap subtle (1.02/0.98) sesuai aturan premium.
// Aturan: animasi Framer Motion subtle + hormati useReducedMotion, kartu Liquid
// Glass grayscale, WCAG dua tema, Bahasa Indonesia.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CountingNumber } from "@animate-ui/react/primitives/texts/counting-number";
import {
  RippleButton,
  RippleButtonRipples,
} from "@animate-ui/react/primitives/buttons/ripple";
import { ArrowRight } from "@/components/animate-ui/icons/arrow-right";
import { ArrowUpRight } from "@/components/animate-ui/icons/arrow-up-right";
import { BadgeCheck } from "@/components/animate-ui/icons/badge-check";
import { BadgePercent } from "@/components/animate-ui/icons/badge-percent";
import { CircleAlert } from "@/components/animate-ui/icons/circle-alert";
import { ListChecks } from "@/components/animate-ui/icons/list-checks";
import { MousePointerClick } from "@/components/animate-ui/icons/mouse-pointer-click";
import { Package } from "@/components/animate-ui/icons/package";
import { PackageCheck } from "@/components/animate-ui/icons/package-check";
import { PackageOpen } from "@/components/animate-ui/icons/package-open";
import { QrCode } from "@/components/animate-ui/icons/qr-code";
import { Rocket } from "@/components/animate-ui/icons/rocket";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { ShoppingBag } from "@/components/animate-ui/icons/shopping-bag";
import { Star } from "@/components/animate-ui/icons/star";
import { Store } from "@/components/animate-ui/icons/store";
import { Wallet } from "@/components/animate-ui/icons/wallet";
import { Zap } from "@/components/animate-ui/icons/zap";
import { api } from "@/lib/api-client";
import { navigateTo } from "@/lib/router";
import { useAppStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/constants";
import { initials } from "@/lib/format";
import type { ProductCardDTO } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProductCard, ProductCardSkeleton } from "./landing-product-card";
import {
  categoryIcon,
  fadeUpItem,
  type IconComponent,
  IconTile,
  Reveal,
  SectionHeading,
  StaggerGroup,
  StarRow,
  useStaggerProps,
} from "./landing-shared";

// -----------------------------------------------------------------------------
// Data & tipe
// -----------------------------------------------------------------------------

interface LandingStatsDTO {
  verifiedTx: number;
  totalProducts: number;
  liveStores: number;
  ratingAvg: number;
  ratingCount: number;
  testimonials: {
    id: string;
    name: string;
    rating: number;
    text: string;
    productTitle: string;
    productSlug: string;
    createdAt: string;
  }[];
}

const HOW_IT_WORKS = [
  {
    icon: MousePointerClick,
    title: "Pilih Produk",
    desc: "Jelajahi katalog dengan filter kategori, harga, dan rating - lalu checkout dalam hitungan detik, tanpa kartu kredit.",
  },
  {
    icon: PackageCheck,
    title: "Terima Prompt & File",
    desc: "Bukti transfermu diverifikasi AI + manual. Begitu Lunas, prompt terstruktur dan file lengkap langsung bisa diunduh.",
  },
  {
    icon: Rocket,
    title: "Eksekusi & Bangun Sendiri",
    desc: "Tempel prompt ke AI tool favoritmu atau jalankan templatenya - hasil akhir sepenuhnya jadi kendali kamu.",
  },
] as const;

const SELLER_BENEFITS = [
  {
    icon: QrCode,
    title: "QR Pembayaran Milik Sendiri",
    desc: "Dana pembeli masuk langsung ke rekeningmu - bukan saldo platform.",
  },
  {
    icon: BadgePercent,
    title: "Komisi Flat & Transparan",
    desc: "Biaya tetap per transaksi; tagihan hanya muncul setelah penjualanmu berjalan.",
  },
  {
    icon: ListChecks,
    title: "Onboarding 4 Langkah",
    desc: "Daftar, atur toko & QR, unggah produk pertama, lolos verifikasi - toko langsung Live.",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Bagaimana cara membayar di Althentic?",
    a: "Pilih produk, buat pesanan, lalu transfer ke QR atau rekening pembayaran milik seller. Unggah bukti transfernya - verifikasi AI dan tim kami berjalan paralel, dan begitu statusnya Lunas, file langsung tersedia untuk diunduh.",
  },
  {
    q: "Apakah perlu kartu kredit?",
    a: "Tidak. Seluruh pembayaran memakai kanal lokal - transfer bank atau QRIS. Kamu hanya perlu memverifikasi email sekali sebelum checkout pertamamu.",
  },
  {
    q: "Format file apa yang saya dapatkan?",
    a: "Produk “Prompt saja” menghasilkan file prompt terstruktur yang rapi dan siap tempel. “Template Jadi” dan “Bundle” menghasilkan ZIP berisi file siap pakai plus panduan eksekusi. Rinciannya selalu tertulis di halaman produk sebelum kamu membayar.",
  },
  {
    q: "Berapa kali saya bisa mengunduh file?",
    a: "Satu kali unduhan per pesanan setelah Lunas, lewat tautan privat yang berbatas waktu. Kalau tautannya bermasalah, kamu punya jendela dispute 7 hari untuk dibantu tim kami.",
  },
  {
    q: "Bagaimana kalau bukti transfer saya ditolak?",
    a: "Kamu menerima notifikasi beserta alasannya, lalu bisa mengunggah ulang bukti yang lebih jelas selama pesanan masih aktif (24 jam). Kalau kedaluwarsa, pesanan otomatis dibatalkan dan kamu bebas memesan ulang.",
  },
  {
    q: "Bagaimana cara menjadi seller?",
    a: "Daftar akun gratis, jalani onboarding 4 langkah (profil toko, QR pembayaran, produk pertama, verifikasi), tunggu inspeksi otomatis lolos - dan tokomu langsung tampil di katalog.",
  },
  {
    q: "Apakah promptnya bisa dipakai di AI tool apa saja?",
    a: "Ya. Prompt ditulis generik dan terstruktur sehingga kompatibel dengan ChatGPT, Claude, Gemini, Copilot, dan AI tool lainnya. Untuk produk template jadi, tersedia panduan eksekusi mandiri langkah demi langkah.",
  },
  {
    q: "Bagaimana keamanan transaksinya?",
    a: "Setiap bukti transfer dipindai AI pendeteksi manipulasi lalu ditinjau manual, file hanya didistribusikan lewat proxy ber-autentikasi, dan seluruh aktivitas tercatat di audit log. Seller yang melanggar ketentuan langsung kami suspend.",
  },
] as const;

// -----------------------------------------------------------------------------
// Hook utilitas
// -----------------------------------------------------------------------------

/** CTA jualan: belum login → dialog daftar; login tanpa toko → onboarding;
 *  sudah punya toko → dashboard seller. */
function useSellerCta() {
  const user = useAppStore((s) => s.user);
  const openAuthDialog = useAppStore((s) => s.openAuthDialog);
  return useCallback(() => {
    if (!user) {
      openAuthDialog("register", "Buat akun gratis untuk membuka tokomu di Althentic.");
    } else if (!user.hasStore) {
      navigateTo({ v: "onboarding" }, { reset: true });
    } else {
      navigateTo({ v: "dashboard" }, { reset: true });
    }
  }, [user, openAuthDialog]);
}

function useTrendingProducts() {
  const [state, setState] = useState<{
    loading: boolean;
    products: ProductCardDTO[];
    error: string | null;
  }>({ loading: true, products: [], error: null });

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await api<{ products: ProductCardDTO[] }>("/api/catalog?sort=weekly");
        if (!ignore) {
          setState({ loading: false, products: data.products.slice(0, 8), error: null });
        }
      } catch (err) {
        if (!ignore) {
          setState({
            loading: false,
            products: [],
            error: err instanceof Error ? err.message : "Gagal memuat produk.",
          });
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  return state;
}

function useLandingStats() {
  const [state, setState] = useState<{
    loading: boolean;
    stats: LandingStatsDTO | null;
    error: string | null;
  }>({ loading: true, stats: null, error: null });

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await api<LandingStatsDTO>("/api/stats");
        if (!ignore) setState({ loading: false, stats: data, error: null });
      } catch (err) {
        if (!ignore) {
          setState({
            loading: false,
            stats: null,
            error: err instanceof Error ? err.message : "Gagal memuat statistik.",
          });
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  return state;
}

// -----------------------------------------------------------------------------
// Section 1 - Hero (latar polos #050505 - revisi desain #3, tanpa background animasi)
// -----------------------------------------------------------------------------

function HeroSection() {
  const sellerCta = useSellerCta();
  const user = useAppStore((s) => s.user);
  const sellerLabel = user?.hasStore ? "Kelola Tokoku" : "Mulai Jualan";

  return (
    <section
      id="beranda"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[88vh] items-center overflow-hidden bg-background"
    >
      {/* REVISI DESAIN #3: Hero tanpa background animasi - latar polos
          mengikuti warna dasar platform (#050505 dark). Tidak ada alternatif
          background apa pun; dekorasi hero ditangani terpisah di luar sesi ini. */}

      <div className="container-page relative z-10 py-20 text-center sm:py-24 lg:py-28">
        {/* Badge kecil di atas headline */}
        <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-foreground sm:text-sm">
          <BadgeCheck className="size-4 text-primary" aria-hidden="true" />
          Marketplace Prompt #1 di Indonesia
        </span>

        <h1
          id="hero-heading"
          className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
        >
          Hasil AI Berkualitas dalam{" "}
          <span className="bg-gradient-to-r from-[var(--brand-navy)] to-[var(--brand-blue)] bg-clip-text text-transparent dark:from-[#ffffff] dark:to-[#8a8a8a]">
            Hitungan Menit
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          Pilih prompt siap pakai dari seller terverifikasi, terima file
          lengkapnya, dan langsung eksekusi di AI tool favoritmu - tanpa kartu
          kredit.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          {/* CTA utama → katalog (RippleButton Animate UI - Task R5).
              Ripple = currentColor (grayscale, kontras di dua tema: gelap di
              tombol terang dark-mode, terang di tombol gelap light-mode).
              transition dibatasi ke translate/box-shadow agar tidak melawan
              spring transform milik motion (scale hover 1.02 / tap 0.98). */}
          <RippleButton
            type="button"
            onClick={() => navigateTo({ v: "catalog" }, { reset: true })}
            hoverScale={1.02}
            tapScale={0.98}
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto sm:px-8"
          >
            <RippleButtonRipples color="currentColor" />
            Jelajahi Katalog
            <ArrowRight
              className="size-5 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </RippleButton>

          {/* CTA sekunder → jualan (auth-aware) */}
          <button
            type="button"
            onClick={sellerCta}
            className="glass inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:-translate-y-0.5 sm:w-auto"
          >
            <Store className="size-4" aria-hidden="true" />
            {sellerLabel}
          </button>
        </div>

        {/* Trust row */}
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-sm text-muted-foreground">
          <li className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Verifikasi AI + manual
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Zap className="size-4 text-primary" aria-hidden="true" />
            Download instan saat Lunas
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Wallet className="size-4 text-primary" aria-hidden="true" />
            QRIS &amp; transfer bank
          </li>
        </ul>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Section 2 - Value Proposition / How It Works (3 langkah, glass + stagger)
// -----------------------------------------------------------------------------

function HowItWorksSection() {
  return (
    <section id="cara-kerja" aria-labelledby="cara-kerja-title" className="section-padding">
      <div className="container-page">
        <SectionHeading
          id="cara-kerja-title"
          eyebrow="Cara Kerja"
          title="Dari Prompt ke Hasil dalam 3 Langkah"
          description="Tanpa langganan, tanpa ribet - kamu pegang kendali penuh atas eksekusinya."
        />

        <StaggerGroup className="mt-10 grid gap-5 md:mt-12 md:gap-6 lg:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div key={step.title} variants={fadeUpItem} className="h-full">
              <div className="glass-card-hover relative h-full p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <IconTile icon={step.icon} />
                  <span
                    aria-hidden="true"
                    className="text-sm font-bold tracking-widest text-muted-foreground/50"
                  >
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Section 3 - Featured / Trending Products (fetch /api/catalog?sort=weekly)
// -----------------------------------------------------------------------------

function TrendingSection() {
  const { loading, products, error } = useTrendingProducts();
  const goToCatalog = () => navigateTo({ v: "catalog" }, { reset: true });

  return (
    <section
      id="produk-unggulan"
      aria-labelledby="produk-unggulan-title"
      className="section-padding"
    >
      <div className="container-page">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="produk-unggulan-title"
            align="left"
            eyebrow="Terlaris Minggu Ini"
            title="Sedang Naik Daun"
            description="Delapan produk paling banyak terverifikasi tujuh hari terakhir - dari template website sampai prompt riset."
          />
          <button
            type="button"
            onClick={goToCatalog}
            className="group inline-flex shrink-0 items-center gap-1.5 self-start rounded-sm px-1 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:self-auto"
          >
            Lihat semua produk
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span className="sr-only">Memuat produk terlaris…</span>
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </>
          ) : error ? (
            <div className="glass-card col-span-full flex items-center justify-center gap-3 px-6 py-10 text-sm text-muted-foreground">
              <CircleAlert className="size-5 shrink-0 text-destructive" aria-hidden="true" />
              <span>
                Produk sedang tidak bisa dimuat ({error}). Coba beberapa saat
                lagi.
              </span>
            </div>
          ) : products.length === 0 ? (
            <div className="glass-card col-span-full flex flex-col items-center gap-3 px-6 py-10 text-center">
              <PackageOpen className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Belum ada produk terlaris minggu ini - jadilah seller pertama
                yang mengisinya.
              </p>
            </div>
          ) : (
            <StaggerGroup className="col-span-full grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {products.map((p) => (
                <motion.div key={p.id} variants={fadeUpItem} className="h-full">
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </StaggerGroup>
          )}
        </div>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Section 4 - Kategori Produk (entry ke katalog per kategori)
// -----------------------------------------------------------------------------

function CategoriesSection() {
  return (
    <section id="kategori" aria-labelledby="kategori-title" className="section-padding">
      <div className="container-page">
        <SectionHeading
          id="kategori-title"
          eyebrow="Kategori"
          title="Temukan Prompt untuk Setiap Kebutuhan"
          description="Enam kategori, satu standar kualitas - pilih titik mulaimu."
        />

        <StaggerGroup className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {CATEGORIES.map((c) => {
            const Icon = categoryIcon(c.icon);
            return (
              <motion.div key={c.id} variants={fadeUpItem} className="h-full">
                <div className="glass-card-hover group relative h-full p-6">
                  <button
                    type="button"
                    onClick={() => navigateTo({ v: "catalog", cat: c.id })}
                    aria-label={`Jelajahi kategori ${c.label}`}
                    className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  />
                  <div className="flex items-start justify-between gap-4">
                    <IconTile icon={Icon} />
                    <ArrowUpRight
                      className="size-5 text-muted-foreground/60 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{c.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {c.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Section 5 - Social Proof (statistik + testimoni dari /api/stats)
// -----------------------------------------------------------------------------

function SocialProofSection() {
  const { loading, stats, error } = useLandingStats();
  const stagger = useStaggerProps();

  // Konfigurasi statistik untuk CountingNumber (Task R5): angka besar
  // dianimasikan count-up saat kartu masuk viewport (sekali saja). Format
  // Indonesia: thousandSeparator=".", rating "4,9" (decimalSeparator=",").
  // Reduced motion: CountingNumber otomatis melompat ke angka final
  // (value.jump) - tetap terbaca tanpa animasi.
  interface StatItem {
    icon: IconComponent;
    label: string;
    number: number;
    decimalPlaces?: number;
    decimalSeparator?: string;
    thousandSeparator?: string;
    /** Teks biasa di luar CountingNumber (mis. " / 5"). */
    suffix?: string;
    /** false → nilai belum tersedia (mis. belum ada review) → tampil "-". */
    hasValue?: boolean;
  }

  const statItems: StatItem[] = stats
    ? [
        {
          icon: ShoppingBag,
          label: "Transaksi Terverifikasi",
          number: stats.verifiedTx,
          thousandSeparator: ".",
        },
        {
          icon: Star,
          label: "Rating Platform",
          number: stats.ratingAvg,
          decimalPlaces: 1,
          decimalSeparator: ",",
          suffix: " / 5",
          hasValue: stats.ratingCount > 0,
        },
        {
          icon: Package,
          label: "Produk Aktif",
          number: stats.totalProducts,
          thousandSeparator: ".",
        },
        {
          icon: Store,
          label: "Toko Live",
          number: stats.liveStores,
          thousandSeparator: ".",
        },
      ]
    : [];

  return (
    <section
      id="social-proof"
      aria-labelledby="social-proof-title"
      className="section-padding"
    >
      <div className="container-page">
        <SectionHeading
          id="social-proof-title"
          eyebrow="Bukti Nyata"
          title="Dipercaya Pekerja AI di Indonesia"
          description="Setiap angka berasal dari transaksi nyata yang terverifikasi - bukan estimasi pemasaran."
        />

        {loading ? (
          <div aria-hidden="true" className="mt-10 space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card p-6">
                  <div className="mx-auto size-10 animate-pulse rounded-xl bg-muted" />
                  <div className="mx-auto mt-3 h-8 w-20 animate-pulse rounded bg-muted" />
                  <div className="mx-auto mt-2.5 h-3.5 w-28 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card p-6">
                  <div className="flex items-center gap-3">
                    <div className="size-11 animate-pulse rounded-full bg-muted" />
                    <div className="space-y-2">
                      <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error || !stats ? (
          <div className="glass-card mx-auto mt-10 flex max-w-xl items-center justify-center gap-3 px-6 py-8 text-sm text-muted-foreground">
            <CircleAlert className="size-5 shrink-0 text-destructive" aria-hidden="true" />
            <span>Statistik sedang tidak tersedia ({error}).</span>
          </div>
        ) : (
          <>
            {/* Angka besar (dl semantik: dt label, dd nilai) - CountingNumber
                Animate UI: count-up saat in-view (margin -64px konsisten dengan
                Reveal), delay mengikuti stagger kartu 80 ms; sr-only final
                number sudah disediakan komponen untuk pembaca layar. */}
            <motion.dl {...stagger} className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {statItems.map((s, i) => (
                <motion.div
                  key={s.label}
                  variants={fadeUpItem}
                  className="glass-card-hover flex flex-col items-center gap-1.5 p-6 text-center"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex size-10 items-center justify-center rounded-xl bg-secondary text-primary"
                  >
                    <s.icon className="size-5" />
                  </span>
                  <dt className="order-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">
                    {s.label}
                  </dt>
                  <dd className="order-1 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                    {s.hasValue === false ? (
                      "-"
                    ) : (
                      <>
                        <CountingNumber
                          number={s.number}
                          decimalPlaces={s.decimalPlaces}
                          decimalSeparator={s.decimalSeparator}
                          thousandSeparator={s.thousandSeparator}
                          delay={i * 80}
                          inViewMargin="-64px"
                        />
                        {s.suffix}
                      </>
                    )}
                  </dd>
                </motion.div>
              ))}
            </motion.dl>

            {/* Testimoni */}
            <StaggerGroup className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {stats.testimonials.slice(0, 3).map((t) => (
                <motion.div key={t.id} variants={fadeUpItem} className="h-full">
                  <div className="glass-card-hover flex h-full flex-col p-6">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--brand-blue))] text-sm font-bold text-primary-foreground"
                      >
                        {initials(t.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{t.name}</p>
                        <StarRow
                          rating={t.rating}
                          label={`Rating ${t.rating} dari 5`}
                          className="mt-0.5"
                        />
                      </div>
                    </div>
                    <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      “{t.text}”
                    </blockquote>
                    <div className="mt-4 border-t border-border/60 pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          navigateTo({ v: "product", id: t.productSlug })
                        }
                        className="inline-flex max-w-full items-center gap-1 rounded-sm text-left text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
                      >
                        <span className="truncate">{t.productTitle}</span>
                        <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </StaggerGroup>
          </>
        )}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Section 6 - Seller CTA (sekunder, panel glass + 3 benefit)
// -----------------------------------------------------------------------------

function SellerCtaSection() {
  const sellerCta = useSellerCta();

  return (
    <section id="jual-prompt" aria-labelledby="jual-prompt-title" className="section-padding">
      <div className="container-page">
        <Reveal>
          <div className="glass-card relative overflow-hidden px-6 py-10 sm:px-10 md:px-14 md:py-14">
            {/* Aksen dekoratif */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand-gradient opacity-15 blur-3xl"
            />

            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                  Untuk Kreator Prompt
                </span>
                <h2
                  id="jual-prompt-title"
                  className="mt-4 text-balance text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl"
                >
                  Punya Prompt Andalan? Jual di Althentic.
                </h2>
                <p className="mt-3 max-w-xl text-balance leading-relaxed text-muted-foreground">
                  Kamu fokus meracik prompt terbaik - verifikasi pembayaran,
                  distribusi file, dan peninjauan kualitas biar kami yang urus.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  {/* RippleButton Animate UI (Task R5) - ripple currentColor
                      grayscale, hover/tap scale subtle 1.02/0.98. */}
                  <RippleButton
                    type="button"
                    onClick={sellerCta}
                    hoverScale={1.02}
                    tapScale={0.98}
                    className="group inline-flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--primary),var(--brand-blue))] px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <RippleButtonRipples color="currentColor" />
                    <Store className="size-4" aria-hidden="true" />
                    Buka Toko Gratis
                  </RippleButton>
                  <button
                    type="button"
                    onClick={() => navigateTo({ v: "docs", tab: "seller" })}
                    className="group inline-flex items-center gap-1.5 rounded-sm px-1 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Pelajari alur seller
                    <ArrowRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              <ul className="grid gap-4 sm:gap-5">
                {SELLER_BENEFITS.map((b) => (
                  <li
                    key={b.title}
                    className="flex items-start gap-4 rounded-2xl border border-border/70 bg-background/50 p-4 backdrop-blur-sm sm:p-5"
                  >
                    <IconTile icon={b.icon} className="size-11 rounded-xl sm:size-11" />
                    <div>
                      <h3 className="text-sm font-semibold sm:text-base">{b.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {b.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Section 7 - FAQ (Accordion shadcn, 8 pertanyaan sales-oriented)
// -----------------------------------------------------------------------------

function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="section-padding">
      <div className="container-page">
        <SectionHeading
          id="faq-title"
          eyebrow="FAQ"
          title="Masih Ada yang Ingin Ditanyakan?"
          description="Jawaban singkat untuk pertanyaan yang paling sering masuk - sisanya ada di Dokumentasi."
        />

        <Reveal className="mt-10 md:mt-12">
          <div className="glass-card px-5 py-2 sm:px-8">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`}>
                  <AccordionTrigger className="py-5 text-left text-sm font-semibold hover:no-underline sm:text-base">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Section 8 - Pre-footer (placeholder abu-abu solid - revisi desain #4, aset
// isometrik grayscale belum tersedia; jangan digenerate/diasumsikan di sini).
// Section 9 (footer) dirender global app shell.
// -----------------------------------------------------------------------------

function IsometricSection() {
  // REVISI DESAIN #4: aset isometrik grayscale belum tersedia - placeholder
  // sederhana (area abu-abu solid) di posisi yang sama, tanpa mengasumsikan
  // desain aset pengganti. Rasio 16:9 mengikuti spesifikasi aset (Lampiran B).
  return (
    <div className="container-page pb-16 md:pb-24">
      <div
        aria-hidden="true"
        className="aspect-video w-full select-none rounded-3xl border border-border bg-neutral-200 dark:bg-neutral-800"
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// LandingPage - komposisi 9 section (footer global, tidak dirender ulang)
// -----------------------------------------------------------------------------

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <TrendingSection />
      <CategoriesSection />
      <SocialProofSection />
      <SellerCtaSection />
      <FaqSection />
      <IsometricSection />
      {/* Section 9 - Footer: sudah dirender global oleh app shell
          (src/components/app/footer.tsx). Tidak diduplikasi di sini. */}
    </>
  );
}
