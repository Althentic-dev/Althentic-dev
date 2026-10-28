"use client";

// OrdersView - Pesanan Saya (daftar order buyer semua status)
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "@/components/animate-ui/icons/clock";
import { Package } from "@/components/animate-ui/icons/package";
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { orderStatusLabel } from "@/lib/constants";
import { formatRupiah, timeAgo } from "@/lib/format";
import type { OrderDTO } from "@/lib/types";

export function OrdersView() {
  const { navigate } = useAppRouter();
  const [orders, setOrders] = useState<OrderDTO[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ orders: OrderDTO[] }>("/api/orders");
        setOrders(res.orders);
      } catch {
        setOrders([]);
      }
    })();
  }, []);

  if (!orders) {
    return (
      <div className="container-page max-w-4xl space-y-4 py-10">
        <Skeleton className="h-9 w-56" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="container-page max-w-4xl py-8 md:py-12">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pesanan Saya</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Semua order kamu - Menunggu Pembayaran, Menunggu Verifikasi, Booked, Lunas, Batal, Kedaluwarsa.
      </p>

      {orders.length === 0 ? (
        <div className="glass-card mt-8 p-10 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">Belum ada pesanan</p>
          <p className="mt-1 text-sm text-muted-foreground">Jelajahi katalog dan beli prompt pertamamu.</p>
          <button
            className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
            onClick={() => navigate({ v: "catalog" }, { reset: true })}
          >
            Buka Katalog
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o, i) => {
            const label = orderStatusLabel(o.status, o.verifyPath);
            return (
              <motion.button
                key={o.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                onClick={() => navigate({ v: "checkout", id: o.id }, { reset: true })}
                className="glass-card-hover flex w-full items-center gap-4 p-4 text-left md:p-5"
                aria-label={`Buka order ${o.code}`}
              >
                {o.product.preview ? (
                  <img src={o.product.preview} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover md:h-20 md:w-20" />
                ) : (
                  <span className="bg-brand-gradient flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl md:h-20 md:w-20">
                    <Package className="h-7 w-7 text-white/80" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{o.code}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        o.status === "verified" || o.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : o.status === "rejected"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : o.status === "cancelled" || o.status === "expired"
                              ? "bg-neutral-500/10 text-neutral-500"
                              : "bg-primary/10 text-primary"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold">{o.product.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {o.store.name} · {formatRupiah(o.price)} · {timeAgo(o.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {["pending_payment", "payment_submitted", "rejected"].includes(o.status) && o.expiresAt && (
                    <Clock className="h-4 w-4 text-amber-500" aria-label="Menunggu aksi" />
                  )}
                  <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
