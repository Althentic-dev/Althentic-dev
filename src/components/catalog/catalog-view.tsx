"use client";

// =============================================================================
// CatalogView — katalog utama (SPEC-03-01..05, GAP-14)
// Filter tersimpan di URL (shareable + back browser), search debounce 300ms,
// grid 3 kolom desktop / 2 tablet / 1 mobile, pagination 24/halaman.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SlidingNumber } from "@animate-ui/react/primitives/texts/sliding-number";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import { Filter } from "@/components/animate-ui/icons/filter";
import { PackageSearch } from "@/components/animate-ui/icons/package-search";
import { Search } from "@/components/animate-ui/icons/search";
import { SlidersHorizontal } from "@/components/animate-ui/icons/sliders-horizontal";
import { Star } from "@/components/animate-ui/icons/star";
import { X } from "@/components/animate-ui/icons/x";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { CATEGORIES, PRICE_CHIPS, RATING_FILTERS, SORT_OPTIONS, SELL_TYPES, categoryLabel } from "@/lib/constants";
import { formatRupiah, formatRating } from "@/lib/format";
import type { ProductCardDTO } from "@/lib/types";

interface CatalogResponse {
  products: ProductCardDTO[];
  total: number;
  page: number;
  totalPages: number;
  popularCategories: string[];
}

export function CatalogView() {
  const { query, navigate } = useAppRouter();
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query.q || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter aktif dari URL (SPEC-03-02)
  const activeCat = query.cat || "";
  const activeType = query.type || "";
  const activePrice = query.price || "";
  const activeRating = query.rating || "all";
  const activeSort = query.sort || "weekly";
  const activeQ = query.q || "";
  const page = parseInt(query.page || "1", 10) || 1;
  const hasFilters = !!(activeCat || activeType || activePrice || activeRating !== "all" || activeQ);

  const setParam = useCallback(
    (key: string, value: string | null, resetPage = true) => {
      const next: Record<string, string | null> = { [key]: value };
      if (resetPage) next.page = null;
      navigate(next);
    },
    [navigate]
  );

  // Search debounce 300ms (SPEC-03-04)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchInput === activeQ) return;
    debounceRef.current = setTimeout(() => {
      setParam("q", searchInput || null);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  // Fetch katalog
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const sp = new URLSearchParams();
    if (activeCat) sp.set("cat", activeCat);
    if (activeType) sp.set("type", activeType);
    if (activePrice) sp.set("price", activePrice);
    if (activeRating !== "all") sp.set("rating", activeRating);
    if (activeSort) sp.set("sort", activeSort);
    if (activeQ) sp.set("q", activeQ);
    sp.set("page", String(page));
    (async () => {
      try {
        const res = await api<CatalogResponse>(`/api/catalog?${sp.toString()}`);
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCat, activeType, activePrice, activeRating, activeSort, activeQ, page]);

  const pageNumbers = useMemo(() => {
    if (!data) return [];
    const total = data.totalPages;
    const cur = data.page;
    const pages: (number | "…")[] = [];
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - cur) <= 1) pages.push(i);
      else if (pages[pages.length - 1] !== "…") pages.push("…");
    }
    return pages.filter((p) => p !== "…" || true);
  }, [data]);

  return (
    <div className="container-page py-8 md:py-12">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Katalog Prompt</h1>
          {/* SlidingNumber Animate UI (Task R5): jumlah produk aktif bergulir
              (odometer) saat filter/search mengubah total — feedback halus bahwa
              hasil diperbarui. initiallyStable → tidak menggulung saat mount,
              hanya saat nilai berubah. Reduced motion → digit melompat instan. */}
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? (
              <>
                <SlidingNumber number={data.total} initiallyStable thousandSeparator="." />
                {" produk aktif — "}
              </>
            ) : (
              "Memuat… — "
            )}
            pembayaran QR lokal, harga Rupiah.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden />
          <Select value={activeSort} onValueChange={(v) => setParam("sort", v)}>
            <SelectTrigger className="h-10 w-[190px] rounded-xl" aria-label="Urutkan katalog">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          className="glass h-12 rounded-2xl pl-11 pr-10 text-sm"
          placeholder="Cari judul produk, deskripsi, atau nama toko…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Cari di katalog"
        />
        {searchInput && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-accent"
            aria-label="Bersihkan pencarian"
            onClick={() => setSearchInput("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter chips: kategori */}
      <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Filter kategori">
        <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Kategori
        </span>
        <FilterChip active={!activeCat} onClick={() => setParam("cat", null)}>
          Semua
        </FilterChip>
        {CATEGORIES.map((c) => (
          <FilterChip key={c.id} active={activeCat === c.id} onClick={() => setParam("cat", c.id)}>
            {c.label}
          </FilterChip>
        ))}
      </div>

      {/* Filter chips: tipe jual (hanya relevan kategori website — GAP-14) */}
      <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Filter tipe jual">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipe</span>
        <FilterChip active={!activeType} onClick={() => setParam("type", null)}>
          Semua
        </FilterChip>
        {SELL_TYPES.map((t) => (
          <FilterChip key={t.id} active={activeType === t.id} onClick={() => setParam("type", t.id)}>
            {t.label}
          </FilterChip>
        ))}
      </div>

      {/* Filter chips: harga + rating */}
      <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter harga dan rating">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Harga</span>
        <FilterChip active={!activePrice} onClick={() => setParam("price", null)}>
          Semua
        </FilterChip>
        {PRICE_CHIPS.map((p) => (
          <FilterChip key={p.id} active={activePrice === p.id} onClick={() => setParam("price", p.id)}>
            {p.label}
          </FilterChip>
        ))}
        <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rating</span>
        {RATING_FILTERS.map((r) => (
          <FilterChip
            key={r.id}
            active={activeRating === r.id}
            onClick={() => setParam("rating", r.id === "all" ? null : r.id)}
          >
            {r.id === "all" ? "Semua" : r.label}
          </FilterChip>
        ))}
      </div>

      {/* Grid produk 3/2/1 (SPEC-03-01) */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : !data || data.products.length === 0 ? (
        /* State tidak ada hasil → 3 chip kategori populer (SPEC-03-04) */
        <EmptyState
          popular={data?.popularCategories ?? []}
          onPick={(label) => {
            const cat = CATEGORIES.find((c) => c.label === label)?.id;
            if (cat) setParam("cat", cat);
          }}
          hasFilters={hasFilters}
          onReset={() =>
            navigate({ cat: null, type: null, price: null, rating: null, q: null, page: null })
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>

          {/* Pagination klasik 24/halaman (SPEC-03-05) */}
          {data.totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Navigasi halaman">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-xl"
                disabled={data.page <= 1}
                onClick={() => setParam("page", String(data.page - 1), false)}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {pageNumbers.map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="px-2 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === data.page ? "default" : "outline"}
                    size="icon"
                    className="h-10 w-10 rounded-xl text-sm"
                    onClick={() => setParam("page", String(p), false)}
                    aria-current={p === data.page ? "page" : undefined}
                  >
                    {p}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-xl"
                disabled={data.page >= data.totalPages}
                onClick={() => setParam("page", String(data.page + 1), false)}
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
          : "border-border bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function ProductCard({ product, index = 0 }: { product: ProductCardDTO; index?: number }) {
  const { navigate } = useAppRouter();
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        onClick={() => navigate({ v: "product", id: product.slug }, { reset: true })}
        className="glass-card-hover group w-full overflow-hidden text-left"
        aria-label={`Lihat produk ${product.title}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {product.preview ? (
            <img
              src={product.preview}
              alt={`Preview ${product.title}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="bg-brand-gradient flex h-full w-full items-center justify-center">
              <PackageSearch className="h-10 w-10 text-white/70" />
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
            {categoryLabel(product.category)}
          </span>
          {product.minPrice === 0 && (
            <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white">
              Gratis
            </span>
          )}
        </div>
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 min-h-[2.6rem] text-sm font-semibold leading-snug group-hover:text-primary">
            {product.title}
          </h3>
          <div className="flex items-center justify-between text-xs">
            <span className="truncate text-muted-foreground">{product.storeName}</span>
            {product.ratingCount > 0 ? (
              <span className="flex shrink-0 items-center gap-1 font-medium">
                <Star className="h-3.5 w-3.5 fill-foreground text-foreground" aria-hidden />
                {formatRating(product.ratingAvg, product.ratingCount)}
              </span>
            ) : (
              <span className="shrink-0 text-muted-foreground">Belum direview</span>
            )}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-base font-bold text-primary">{formatRupiah(product.minPrice)}</span>
            {product.sellTypes.length > 1 && (
              <span className="text-[11px] text-muted-foreground">
                {product.sellTypes.length} tipe jual
              </span>
            )}
          </div>
        </div>
      </button>
    </motion.article>
  );
}

function EmptyState({
  popular,
  onPick,
  hasFilters,
  onReset,
}: {
  popular: string[];
  onPick: (label: string) => void;
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="glass-card mx-auto max-w-lg p-10 text-center">
      <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
      <h2 className="mt-4 text-lg font-bold">Tidak ada hasil</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Coba kata kunci lain, atau jelajahi kategori populer saat ini:
      </p>
      {/* 3 chip kategori populer (SPEC-03-04) */}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {(popular.length ? popular : ["Website", "Riset", "Konten & Copywriting"]).map((label) => (
          <button
            key={label}
            onClick={() => onPick(label)}
            className="rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            {label}
          </button>
        ))}
      </div>
      {hasFilters && (
        <Button variant="outline" className="mt-6 rounded-full" onClick={onReset}>
          <X className="h-4 w-4" /> Reset semua filter
        </Button>
      )}
    </div>
  );
}
