"use client";

// StatusView - halaman status sederhana (SPEC-13-05)
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "@/components/animate-ui/icons/activity";
import { CircleCheck } from "@/components/animate-ui/icons/circle-check";
import { CircleAlert } from "@/components/animate-ui/icons/circle-alert";
import { RefreshCw } from "@/components/animate-ui/icons/refresh-cw";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/format";

interface StatusData {
  overall: string;
  services: { name: string; status: string; latencyMs?: number; note: string }[];
  checkedAt: string;
  note: string;
}

export function StatusView() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api<StatusData>("/api/status");
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container-page max-w-3xl py-8 md:py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight md:text-3xl">
            <Activity className="h-7 w-7 text-primary" /> Status Layanan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kesehatan database, storage, dan endpoint kritis - diperbarui manual saat insiden.
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Muat ulang
        </Button>
      </div>

      {loading && !data ? (
        <div role="status" aria-label="Memuat status layanan" aria-live="polite" aria-busy="true" className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : data ? (
        <>
          <div
            className={`glass-card mt-8 flex items-center gap-3 p-5 ${
              data.overall === "operational" ? "border-emerald-500/30" : "border-amber-500/40"
            }`}
            role="status"
          >
            {data.overall === "operational" ? (
              <CircleCheck className="h-6 w-6 text-emerald-500" />
            ) : (
              <CircleAlert className="h-6 w-6 text-amber-500" />
            )}
            <div>
              <p className="font-bold">
                {data.overall === "operational" ? "Semua sistem beroperasi normal" : "Sebagian sistem terdegradasi"}
              </p>
              <p className="text-xs text-muted-foreground">Dicek {formatDate(data.checkedAt, true)}</p>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {data.services.map((s, i) => (
              <motion.li
                key={s.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card flex items-center justify-between gap-4 p-4"
              >
                <div>
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.note}</p>
                </div>
                <span
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    s.status === "operational"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : s.status === "degraded"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      s.status === "operational" ? "bg-emerald-500" : s.status === "degraded" ? "bg-amber-500" : "bg-red-500"
                    }`}
                    aria-hidden
                  />
                  {s.status === "operational" ? "Normal" : s.status === "degraded" ? "Terdegradasi" : "Gangguan"}
                </span>
              </motion.li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">{data.note}</p>
        </>
      ) : null}
    </div>
  );
}
