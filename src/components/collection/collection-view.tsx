"use client";

// CollectionView — Koleksi Saya (SPEC-11-06): order Lunas permanen, tombol unduh,
// info versi, tanggal beli. Tombol berubah "Sudah diunduh" (disabled) — GAP-13.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download } from "@/components/animate-ui/icons/download";
import { Lock } from "@/components/animate-ui/icons/lock";
import { Package } from "@/components/animate-ui/icons/package";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAppRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { formatRupiah, formatDate } from "@/lib/format";

interface CollectionItem {
  orderId: string;
  code: string;
  title: string;
  slug: string;
  preview: string | null;
  version: number;
  storeName: string;
  storeSlug: string;
  price: number;
  verifiedAt: string | null;
  downloadUsedAt: string | null;
}

export function CollectionView() {
  const { navigate } = useAppRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<CollectionItem[] | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api<{ items: CollectionItem[] }>("/api/collection");
      setItems(res.items);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const download = async (item: CollectionItem) => {
    setDownloading(item.orderId);
    try {
      const res = await fetch(`/api/download/${item.orderId}`, { credentials: "include" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Gagal mengunduh");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.slug}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "File terunduh", description: "Kuota unduh 1x terpakai untuk order ini." });
      await load();
    } catch (err) {
      toast({ title: "Unduhan gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  if (!items) {
    return (
      <div className="container-page max-w-5xl space-y-4 py-10">
        <Skeleton className="h-9 w-64" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="container-page max-w-5xl py-8 md:py-12">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Koleksi Saya</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Bukti kepemilikan permanen atas semua produk yang kamu beli. Kuota unduh 1x per order —
        tombol berubah otomatis setelah dipakai.
      </p>

      {items.length === 0 ? (
        <div className="glass-card mt-8 p-10 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">Koleksi masih kosong</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Produk yang kamu beli akan tampil di sini setelah pembayaran terverifikasi.
          </p>
          <button
            className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
            onClick={() => navigate({ v: "catalog" }, { reset: true })}
          >
            Belanja Sekarang
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item, i) => (
            <motion.div
              key={item.orderId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
              className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center md:p-5"
            >
              {item.preview ? (
                <img src={item.preview} alt="" className="h-20 w-full rounded-2xl object-cover sm:h-20 sm:w-28" />
              ) : (
                <span className="bg-brand-gradient flex h-20 w-full items-center justify-center rounded-2xl sm:w-28">
                  <Package className="h-8 w-8 text-white/80" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                    v{item.version}
                  </span>
                </div>
                <p className="mt-1 truncate font-semibold">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.storeName} · Dibeli {formatDate(item.verifiedAt ?? "")} · {formatRupiah(item.price)}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" />
                  Lisensi personal &amp; komersial atas output — dilarang menjual ulang file mentah.
                </p>
              </div>
              <div className="shrink-0">
                {item.downloadUsedAt ? (
                  <Button variant="outline" className="w-full rounded-xl sm:w-auto" disabled>
                    <Lock className="h-4 w-4" /> Sudah diunduh
                  </Button>
                ) : (
                  <Button
                    className="w-full rounded-xl sm:w-auto"
                    onClick={() => download(item)}
                    disabled={downloading === item.orderId}
                  >
                    {downloading === item.orderId ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Unduh File
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
