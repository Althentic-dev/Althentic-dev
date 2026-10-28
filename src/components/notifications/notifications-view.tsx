"use client";

// NotificationsView - halaman penuh notifikasi (SPEC-13-02)
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell } from "@/components/animate-ui/icons/bell";
import { CheckCheck } from "@/components/animate-ui/icons/check-check";
import { FileText } from "@/components/animate-ui/icons/file-text";
import { Package } from "@/components/animate-ui/icons/package";
import { Receipt } from "@/components/animate-ui/icons/receipt";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import type { NotificationDTO } from "@/lib/types";

const ICONS: Record<string, React.ElementType> = {
  order_update: Package,
  verification_result: Sparkles,
  invoice: Receipt,
  product_update: FileText,
  system: Bell,
};

export function NotificationsView() {
  const { navigate } = useAppRouter();
  const { setNotifications } = useAppStore();
  const [items, setItems] = useState<NotificationDTO[] | null>(null);

  const load = async () => {
    try {
      const res = await api<{ notifications: NotificationDTO[] }>("/api/notifications");
      setItems(res.notifications);
      setNotifications(res.notifications);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async: setState setelah await
    load();
  }, []);

  const markAll = async () => {
    await api("/api/notifications/read-all", { method: "POST" }).catch(() => undefined);
    load();
  };

  const open = (n: NotificationDTO) => {
    if (!n.readAt) {
      api("/api/notifications/read-all", { method: "POST" }).catch(() => undefined);
    }
    if (n.linkQuery) {
      const sp = new URLSearchParams(n.linkQuery);
      const q: Record<string, string> = {};
      sp.forEach((v, k) => (q[k] = v));
      navigate(q, { reset: true });
    }
  };

  return (
    <div className="container-page max-w-2xl py-8 md:py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Notifikasi</h1>
        {items && items.some((n) => !n.readAt) && (
          <Button variant="outline" size="sm" className="rounded-full" onClick={markAll}>
            <CheckCheck className="h-4 w-4" /> Tandai semua terbaca
          </Button>
        )}
      </div>

      {!items ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card mt-6 p-10 text-center">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">Belum ada notifikasi</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Update order, hasil verifikasi, dan tagihan komisi akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((n, i) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                onClick={() => open(n)}
                className={`glass-card flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-accent/60 ${
                  !n.readAt ? "border-primary/30" : ""
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    !n.readAt ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${!n.readAt ? "font-bold" : "font-semibold"}`}>{n.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{n.body}</span>
                </span>
                {!n.readAt && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Belum dibaca" />}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
