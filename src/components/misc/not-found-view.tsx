"use client";

// NotFoundView — 404/500 mengikuti bahasa visual landing (SPEC-13-04):
// pesan singkat + 3 tautan pemulihan (katalog, produk terlaris, halaman sebelumnya).
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Compass } from "@/components/animate-ui/icons/compass";
import { Flame } from "@/components/animate-ui/icons/flame";
import { PackageSearch } from "@/components/animate-ui/icons/package-search";
import { Undo2 } from "@/components/animate-ui/icons/undo-2";
import { useAppRouter, backOrHome } from "@/lib/router";
import { api } from "@/lib/api-client";
import type { ProductCardDTO } from "@/lib/types";

export function NotFoundView({ message }: { message?: string }) {
  const { navigate } = useAppRouter();
  const [bestSeller, setBestSeller] = useState<ProductCardDTO | null>(null);

  useEffect(() => {
    api<{ products: ProductCardDTO[] }>("/api/catalog?sort=weekly")
      .then((r) => setBestSeller(r.products[0] ?? null))
      .catch(() => setBestSeller(null));
  }, []);

  return (
    <div className="container-page relative flex min-h-[72vh] items-center justify-center overflow-hidden py-20">
      {/* Dekorasi gradient halus ala hero */}
      <div className="bg-brand-gradient pointer-events-none absolute -top-40 left-1/2 h-96 w-[720px] -translate-x-1/2 rounded-full opacity-[0.07] blur-3xl" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card relative z-10 w-full max-w-xl p-10 text-center"
      >
        <span className="bg-brand-gradient mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-xl">
          <Compass className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight">
          <span className="text-gradient-brand">404</span>
        </h1>
        <p className="mt-2 text-lg font-semibold">Halaman tidak ditemukan</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {message ?? "Tautan yang kamu tuju tidak tersedia atau sudah dipindahkan."}
        </p>

        {/* 3 tautan pemulihan (SPEC-13-04) */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <button
            className="flex flex-col items-center gap-2 rounded-2xl border border-border p-4 text-sm font-medium transition-all hover:border-primary/50 hover:bg-accent/50"
            onClick={() => navigate({ v: "catalog" }, { reset: true })}
          >
            <PackageSearch className="h-5 w-5 text-primary" />
            Katalog Produk
          </button>
          <button
            className="flex flex-col items-center gap-2 rounded-2xl border border-border p-4 text-sm font-medium transition-all hover:border-primary/50 hover:bg-accent/50 disabled:opacity-50"
            onClick={() => bestSeller && navigate({ v: "product", id: bestSeller.slug }, { reset: true })}
            disabled={!bestSeller}
          >
            <Flame className="h-5 w-5 text-primary" />
            Produk Terlaris
          </button>
          <button
            className="flex flex-col items-center gap-2 rounded-2xl border border-border p-4 text-sm font-medium transition-all hover:border-primary/50 hover:bg-accent/50"
            onClick={backOrHome}
          >
            <Undo2 className="h-5 w-5 text-muted-foreground" />
            Halaman Sebelumnya
          </button>
        </div>
      </motion.div>
    </div>
  );
}
