"use client";

// =============================================================================
// Althentic.Dev - Kartu produk landing (section 3: Featured/Trending) + skeleton
// loading animate-pulse. Kartu Liquid Glass (.glass-card-hover) dengan pola
// "stretched button": satu tombol full-card untuk aksesibilitas & keyboard.
// =============================================================================

import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { Store } from "@/components/animate-ui/icons/store";
import { Badge } from "@/components/ui/badge";
import { categoryLabel } from "@/lib/constants";
import { formatRating, formatRupiah } from "@/lib/format";
import { navigateTo } from "@/lib/router";
import type { ProductCardDTO } from "@/lib/types";
import { StarRow } from "./landing-shared";

export function ProductCard({ product }: { product: ProductCardDTO }) {
  const hasMultipleTypes = product.sellTypes.length > 1;
  const goToProduct = () => navigateTo({ v: "product", id: product.slug });

  return (
    <article className="glass-card-hover group relative flex h-full flex-col overflow-hidden text-left">
      {/* Stretched button - seluruh kartu bisa diklik & focus-visible jelas */}
      <button
        type="button"
        onClick={goToProduct}
        aria-label={`Buka produk ${product.title} oleh ${product.storeName}`}
        className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />

      {/* Gambar pratinjau (img biasa - URL /api/files dari API) */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.preview ? (
          <img
            src={product.preview}
            alt={`Pratinjau produk ${product.title} - ${categoryLabel(product.category)}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--secondary),var(--accent))]">
            <Sparkles className="size-8 text-primary/50" aria-hidden="true" />
          </div>
        )}
        <Badge
          variant="secondary"
          className="absolute left-3 top-3 border-transparent bg-black/60 text-white backdrop-blur-sm"
        >
          {categoryLabel(product.category)}
        </Badge>
      </div>

      {/* Info produk */}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">
          {product.title}
        </h3>

        <div className="flex items-center gap-1.5">
          <StarRow rating={product.ratingAvg} />
          <span className="text-xs text-muted-foreground">
            {formatRating(product.ratingAvg, product.ratingCount)}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0">
            <span className="block text-xs text-muted-foreground">
              {hasMultipleTypes ? "Mulai dari" : "Harga"}
            </span>
            <span className="text-lg font-bold text-primary">
              {formatRupiah(product.minPrice)}
            </span>
          </div>
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Store className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{product.storeName}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden" aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="flex items-end justify-between pt-2">
          <div className="space-y-1.5">
            <div className="h-2.5 w-14 animate-pulse rounded bg-muted" />
            <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
