"use client";

// =============================================================================
// Footer — 4 kolom grid, professional style (Landing section 9 / GAP-10).
// Sticky di dasar viewport saat konten pendek (flex-col + mt-auto).
// =============================================================================

import { Hexagon } from "@/components/animate-ui/icons/hexagon";
import { Instagram } from "@/components/animate-ui/icons/instagram";
import { Twitter } from "@/components/animate-ui/icons/twitter";
import { Music2 } from "@/components/animate-ui/icons/music-2";
import { navigateTo } from "@/lib/router";

const COLS = [
  {
    title: "Produk",
    links: [
      { label: "Katalog Prompt", query: { v: "catalog" } },
      { label: "Prompt Generator", query: { v: "generator" } },
      { label: "Dokumentasi", query: { v: "docs" } },
      { label: "Status Layanan", query: { v: "status" } },
    ],
  },
  {
    title: "Untuk Seller",
    links: [
      { label: "Buka Toko Gratis", query: { v: "onboarding" } },
      { label: "Panduan Seller", query: { v: "docs", tab: "seller" } },
      { label: "Komisi & Tagihan", query: { v: "docs", tab: "seller" } },
      { label: "Kebijakan Marketplace", query: { v: "docs", tab: "policy" } },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { label: "Panduan Buyer", query: { v: "docs", tab: "buyer" } },
      { label: "FAQ", query: { v: "docs", tab: "faq" } },
      { label: "Troubleshooting", query: { v: "docs", tab: "troubleshooting" } },
      { label: "Laporkan Masalah", query: { v: "docs", tab: "contact" } },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Syarat & Ketentuan", query: { v: "legal", doc: "tos" } },
      { label: "Kebijakan Privasi", query: { v: "legal", doc: "privacy" } },
      { label: "Keamanan Transaksi", query: { v: "docs", tab: "security" } },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-[linear-gradient(180deg,transparent,rgba(29,78,216,0.04))]">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Kolom brand */}
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="bg-brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white">
              <Hexagon className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span className="text-[17px]">
              Althentic<span className="text-primary">.Dev</span>
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Marketplace prompt serbaguna untuk website, riset, belajar, konten, dan desain.
            Beli sekali, eksekusi langsung bersama AI favoritmu.
          </p>
          <div className="mt-4 flex items-center gap-1">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Althentic"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter) Althentic"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok Althentic"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Music2 className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* 3 kolom link */}
        {COLS.map((col) => (
          <nav key={col.title} aria-label={`Footer ${col.title}`}>
            <h3 className="text-sm font-semibold tracking-wide text-foreground">
              {col.title}
            </h3>
            <ul className="mt-3 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={`/?${new URLSearchParams(l.query).toString()}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(l.query, { reset: true });
                    }}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border/60">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Althentic.Dev — Marketplace Prompt Serbaguna.</span>
          <span>
            Pembayaran QR lokal · Harga Rupiah · Komunitas Indonesia · Hukum Indonesia
            (domisili Aceh Besar)
          </span>
        </div>
      </div>
    </footer>
  );
}
