"use client";

// StoreView — profil publik toko (SPEC-13-01): branding, warna aksen, deskripsi,
// ikon sosial media (Lucide), statistik publik, grid produk.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck } from "@/components/animate-ui/icons/badge-check";
import { CalendarDays } from "@/components/animate-ui/icons/calendar-days";
import { Instagram } from "@/components/animate-ui/icons/instagram";
import { Music2 } from "@/components/animate-ui/icons/music-2";
import { Package } from "@/components/animate-ui/icons/package";
import { Star } from "@/components/animate-ui/icons/star";
import { Store as StoreIcon } from "@/components/animate-ui/icons/store";
import { Twitter } from "@/components/animate-ui/icons/twitter";
import { Users } from "@/components/animate-ui/icons/users";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { ACCENT_PRESETS, storeStatusLabel } from "@/lib/constants";
import { formatRating } from "@/lib/format";
import type { StorePublicDTO } from "@/lib/types";
import { ProductCard } from "@/components/catalog/catalog-view";

export function StoreView({ slug }: { slug?: string }) {
  const { navigate } = useAppRouter();
  const [store, setStore] = useState<StorePublicDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (async () => {
      try {
        const res = await api<{ store: StorePublicDTO }>(`/api/stores/${slug}`);
        setStore(res.store);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-48 w-full rounded-3xl md:h-64" />
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }
  if (error || !store) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-bold">Toko tidak ditemukan</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
      </div>
    );
  }

  const accent = ACCENT_PRESETS[store.accent]?.hex ?? ACCENT_PRESETS[0].hex;

  return (
    <div className="container-page py-8 md:py-10">
      {/* Banner dengan aksen toko (SPEC-02-02: aksen hanya banner/badge/CTA toko) */}
      <div className="glass-card overflow-hidden">
        <div className="relative">
          {store.bannerUrl ? (
            <img
              src={store.bannerUrl}
              alt={`Banner toko ${store.name}`}
              className="h-44 w-full object-cover md:h-60"
            />
          ) : (
            <div className="h-44 w-full md:h-60" style={{ background: `linear-gradient(135deg, ${accent}, var(--brand-navy))` }} />
          )}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: `linear-gradient(180deg, transparent 40%, var(--background) 100%)` }}
          />
        </div>

        <div className="relative -mt-14 px-5 pb-6 md:-mt-16 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <span
                className="flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-xl md:h-24 md:w-24"
                style={{ background: `linear-gradient(135deg, ${accent}, var(--brand-navy))` }}
              >
                <StoreIcon className="h-9 w-9 md:h-11 md:w-11" />
              </span>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{store.name}</h1>
                  {store.status === "live" && (
                    <span
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                      style={{ backgroundColor: accent }}
                    >
                      <BadgeCheck className="h-3 w-3" /> {storeStatusLabel(store.status)}
                    </span>
                  )}
                  {store.status !== "live" && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                      {storeStatusLabel(store.status)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">/toko/{store.slug}</p>
              </div>
            </div>

            {/* Ikon sosial media — dirender sebagai ikon Lucide (DESIGN.md batasan icon) */}
            <div className="flex items-center gap-1 pb-1">
              {store.socials.ig && (
                <a
                  href={`https://instagram.com/${store.socials.ig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Instagram ${store.name}`}
                  className="rounded-xl p-2.5 text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {store.socials.x && (
                <a
                  href={`https://x.com/${store.socials.x}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`X ${store.name}`}
                  className="rounded-xl p-2.5 text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {store.socials.tiktok && (
                <a
                  href={`https://tiktok.com/@${store.socials.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`TikTok ${store.name}`}
                  className="rounded-xl p-2.5 text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                >
                  <Music2 className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{store.description}</p>

          {/* Statistik publik */}
          <dl className="mt-5 flex flex-wrap gap-3 text-sm">
            <div className="glass flex items-center gap-2 rounded-2xl px-4 py-2.5">
              <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
              <dt className="text-muted-foreground">Produk</dt>
              <dd className="font-bold">{store.stats.productCount}</dd>
            </div>
            <div className="glass flex items-center gap-2 rounded-2xl px-4 py-2.5">
              <Star className="h-4 w-4 fill-foreground text-foreground" aria-hidden />
              <dt className="text-muted-foreground">Rating</dt>
              <dd className="font-bold">{formatRating(store.stats.ratingAvg, store.stats.ratingCount)}</dd>
            </div>
            <div className="glass flex items-center gap-2 rounded-2xl px-4 py-2.5">
              <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
              <dt className="text-muted-foreground">Bergabung</dt>
              <dd className="font-bold">{store.stats.joinedYear}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Grid produk toko */}
      <section className="mt-10" aria-labelledby="produk-toko">
        <h2 id="produk-toko" className="flex items-center gap-2 text-lg font-bold">
          <Users className="h-5 w-5 text-muted-foreground" aria-hidden /> Produk Toko
        </h2>
        {store.products.length === 0 ? (
          <div className="glass-card mt-4 p-10 text-center text-sm text-muted-foreground">
            Toko ini belum memiliki produk aktif.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {store.products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
