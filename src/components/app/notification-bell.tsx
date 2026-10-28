"use client";

// Notification center — ikon lonceng + panel (SPEC-13-02):
// update order, hasil verifikasi produk, tagihan komisi/invoice, update produk
// dibeli (hanya saat ZIP inti berubah — GAP-05). Penanda belum-baca + link objek.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "@/components/animate-ui/icons/bell";
import { CheckCheck } from "@/components/animate-ui/icons/check-check";
import { FileText } from "@/components/animate-ui/icons/file-text";
import { Package } from "@/components/animate-ui/icons/package";
import { Receipt } from "@/components/animate-ui/icons/receipt";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { navigateTo } from "@/lib/router";
import { timeAgo } from "@/lib/format";
import type { NotificationDTO } from "@/lib/types";

const ICONS: Record<string, React.ElementType> = {
  order_update: Package,
  verification_result: Sparkles,
  invoice: Receipt,
  product_update: FileText,
  system: Bell,
};

export function NotificationBell() {
  const { user, notifications, unreadCount, setNotifications } = useAppStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api<{ notifications: NotificationDTO[] }>("/api/notifications");
      setNotifications(data.notifications);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  // Tutup panel saat klik di luar
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const markAllRead = async () => {
    try {
      await api("/api/notifications/read-all", { method: "POST" });
      load();
    } catch {
      /* silent */
    }
  };

  const openItem = (n: NotificationDTO) => {
    if (n.linkQuery) {
      const sp = new URLSearchParams(n.linkQuery);
      const q: Record<string, string> = {};
      sp.forEach((v, k) => (q[k] = v));
      navigateTo(q, { reset: true });
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Notifikasi${unreadCount > 0 ? ` — ${unreadCount} belum dibaca` : ""}`}
        className="relative rounded-full"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong absolute right-0 top-12 z-50 w-[min(92vw,380px)] rounded-2xl p-2"
            role="dialog"
            aria-label="Pusat notifikasi"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-semibold">Notifikasi</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={markAllRead}
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Tandai terbaca
                </Button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Memuat…
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Belum ada notifikasi.
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = ICONS[n.type] ?? Bell;
                  return (
                    <button
                      key={n.id}
                      onClick={() => openItem(n)}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                        !n.readAt ? "bg-primary/5" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          !n.readAt ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`truncate text-sm ${!n.readAt ? "font-semibold" : "font-medium"}`}>
                            {n.title}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {timeAgo(n.createdAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                          {n.body}
                        </span>
                      </span>
                      {!n.readAt && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
