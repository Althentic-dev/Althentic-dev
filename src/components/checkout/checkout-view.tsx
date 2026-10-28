"use client";

// =============================================================================
// CheckoutView — alur order buyer (SPEC-04-02..08, GAP-01/11/13):
// Bayar Sekarang → QR seller → upload bukti (preview dulu) → AI verifikasi →
// timeline stepper 6 status + Booked → unduh 1x → dispute 7 hari.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck } from "@/components/animate-ui/icons/badge-check";
import { Ban } from "@/components/animate-ui/icons/ban";
import { CircleAlert } from "@/components/animate-ui/icons/circle-alert";
import { Clock } from "@/components/animate-ui/icons/clock";
import { Download } from "@/components/animate-ui/icons/download";
import { ExternalLink } from "@/components/animate-ui/icons/external-link";
import { Eye } from "@/components/animate-ui/icons/eye";
import { FileImage } from "@/components/animate-ui/icons/file-image";
import { Handshake } from "@/components/animate-ui/icons/handshake";
import { ImagePlus } from "@/components/animate-ui/icons/image-plus";
import { LoaderCircle as Loader2 } from "@/components/animate-ui/icons/loader-circle";
import { Lock } from "@/components/animate-ui/icons/lock";
import { MessageCircle } from "@/components/animate-ui/icons/message-circle";
import { QrCode } from "@/components/animate-ui/icons/qr-code";
import { RefreshCw } from "@/components/animate-ui/icons/refresh-cw";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { Timer } from "@/components/animate-ui/icons/timer";
import { Upload } from "@/components/animate-ui/icons/upload";
import { X } from "@/components/animate-ui/icons/x";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAppRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { orderStatusLabel, sellTypeLabel } from "@/lib/constants";
import { formatRupiah, formatDate, timeAgo } from "@/lib/format";
import type { OrderDTO } from "@/lib/types";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"];
const MAX_MB = 5;

export function CheckoutView({ orderId }: { orderId?: string }) {
  const { navigate } = useAppRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<(OrderDTO & { waLink?: string | null; buyerLimited?: { name: string } | null }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingPay, setStartingPay] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await api<{ order: OrderDTO & { waLink?: string | null; buyerLimited?: { name: string } | null } }>(
        `/api/orders/${orderId}`
      );
      setOrder(res.order);
    } catch (err) {
      toast({ title: "Gagal memuat order", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [orderId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll ringan saat menunggu verifikasi AI/manual
  useEffect(() => {
    if (order?.status === "payment_submitted") {
      const t = setInterval(load, 8000);
      return () => clearInterval(t);
    }
  }, [order?.status, load]);

  const startPay = async () => {
    setStartingPay(true);
    try {
      const res = await api<{ qrUrl: string | null }>(`/api/orders/${orderId}/pay-session`, { method: "POST" });
      await load();
      toast({
        title: "Sesi pembayaran dimulai",
        description: "Scan QR dan upload bukti sebelum order kedaluwarsa (24 jam dari checkout).",
      });
      void res;
    } catch (err) {
      toast({ title: "Gagal memulai sesi", description: (err as Error).message, variant: "destructive" });
    } finally {
      setStartingPay(false);
    }
  };

  const pickFile = (f: File | null) => {
    setScanResult(null);
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type.toLowerCase())) {
      toast({ title: "Format tidak didukung", description: "Bukti harus gambar JPG, PNG, atau HEIC.", variant: "destructive" });
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: `Ukuran maksimal ${MAX_MB} MB.`, variant: "destructive" });
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submitReceipt = async () => {
    if (!file || !orderId) return;
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      const res = await api<{ status: string; message: string }>(`/api/orders/${orderId}/receipt`, {
        method: "POST",
        json: {
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          dataBase64: btoa(binary),
        },
      });
      setScanResult(res.message);
      setFile(null);
      setFilePreview(null);
      await load();
      toast({ title: "Bukti dikirim", description: res.message });
    } catch (err) {
      toast({ title: "Upload gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const cancel = async () => {
    if (!orderId) return;
    try {
      await api(`/api/orders/${orderId}/cancel`, { method: "POST" });
      toast({ title: "Order dibatalkan" });
      await load();
    } catch (err) {
      toast({ title: "Gagal membatalkan", description: (err as Error).message, variant: "destructive" });
    }
  };

  const download = async () => {
    if (!orderId) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/download/${orderId}`, { credentials: "include" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Gagal mengunduh");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${order?.product.slug ?? "produk"}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({
        title: "File terunduh",
        description: "Kuota unduh 1x sudah terpakai. Simpan file ini dengan baik.",
      });
      await load();
    } catch (err) {
      toast({ title: "Unduhan gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-page max-w-4xl py-10">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-72 w-full rounded-3xl" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-bold">Order tidak ditemukan</h1>
        <Button className="mt-6 rounded-full" onClick={() => navigate({ v: "orders" }, { reset: true })}>
          Lihat Pesanan Saya
        </Button>
      </div>
    );
  }

  const label = orderStatusLabel(order.status, order.verifyPath);
  const canPay = order.status === "pending_payment" || order.status === "rejected";
  const canCancel = ["pending_payment", "payment_submitted", "rejected"].includes(order.status);
  const canDownload = (order.status === "verified" || order.status === "completed") && !order.downloadUsedAt;
  const expired = new Date(order.expiresAt ?? "") < new Date();

  return (
    <div className="container-page max-w-4xl py-8 md:py-12">
      {/* Header order */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order {order.code}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.product.title} · {sellTypeLabel(order.sellType)} · Dari toko{" "}
            <button className="font-medium text-primary hover:underline" onClick={() => navigate({ v: "store", id: order.store.slug })}>
              {order.store.name}
            </button>
          </p>
        </div>
        <span
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
            order.status === "verified" || order.status === "completed"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : order.status === "rejected"
                ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                : order.status === "cancelled" || order.status === "expired"
                  ? "border-neutral-500/30 bg-neutral-500/10 text-neutral-500"
                  : "border-primary/30 bg-primary/10 text-primary"
          }`}
        >
          {label}
        </span>
      </div>

      {/* ==== Timeline stepper (SPEC-04-05) ==== */}
      <OrderTimeline order={order} />

      {/* ==== Konten utama per status ==== */}
      <AnimatePresence mode="wait">
        {canPay && !expired && (
          <motion.div
            key="pay"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card mt-6 p-6 md:p-8"
          >
            {!order.paySessionStartedAt ? (
              <div className="text-center">
                <span className="bg-brand-gradient mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white">
                  <QrCode className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-lg font-bold">Siap membayar?</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Tekan <b>Bayar Sekarang</b> untuk memulai sesi pembayaran. QR bisnis milik{" "}
                  <b>{order.store.name}</b> akan ditampilkan — nominal transfer{" "}
                  <b>{formatRupiah(order.price)}</b>.
                  {order.price === 0 && " Produk ini gratis — cukup konfirmasi."}
                </p>
                <Button className="mt-6 h-12 rounded-2xl px-8 text-base font-semibold" onClick={startPay} disabled={startingPay}>
                  {startingPay ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5" />}
                  Bayar Sekarang
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" />
                  Order kedaluwarsa {timeAgo(order.expiresAt ?? "").replace(" lalu", " lagi").replace("baru saja", "dalam 24 jam")}
                </p>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-[280px_1fr]">
                {/* QR seller */}
                <div className="text-center">
                  <div className="glass mx-auto inline-block rounded-3xl p-4">
                    {order.qrUrl ? (
                      <img src={order.qrUrl} alt={`QR pembayaran toko ${order.store.name}`} className="h-56 w-56 rounded-2xl object-contain" />
                    ) : (
                      <div className="flex h-56 w-56 items-center justify-center rounded-2xl bg-muted">
                        <QrCode className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    QR bisnis {order.store.name} — Althentic tidak memegang uangmu.
                  </p>
                  <p className="mt-1 text-2xl font-bold text-primary">{formatRupiah(order.price)}</p>
                </div>

                {/* Upload bukti — preview wajib sebelum submit (SPEC-04-04) */}
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold">
                    <Upload className="h-4 w-4" /> Upload Bukti Transfer
                  </h2>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Satu gambar per percobaan · JPG/PNG/HEIC · maks {MAX_MB} MB · nominal harus{" "}
                    <b>persis {formatRupiah(order.price)}</b>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic,.heic"
                    className="sr-only"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                    aria-label="Pilih file bukti transfer"
                  />
                  {!filePreview ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        pickFile(e.dataTransfer.files?.[0] ?? null);
                      }}
                      className={`mt-4 flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-8 transition-all ${
                        dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-accent/40"
                      }`}
                    >
                      <ImagePlus className="h-9 w-9 text-muted-foreground" />
                      <span className="text-sm font-medium">Klik atau tarik bukti transfer ke sini</span>
                      <span className="text-xs text-muted-foreground">Screenshot aplikasi bank / e-wallet kamu</span>
                    </button>
                  ) : (
                    <div className="mt-4">
                      <div className="glass relative overflow-hidden rounded-3xl p-3">
                        <img src={filePreview} alt="Pratinjau bukti transfer" className="mx-auto max-h-72 rounded-2xl object-contain" />
                        <button
                          className="absolute right-5 top-5 rounded-full bg-background/90 p-2 backdrop-blur transition-transform hover:scale-110"
                          onClick={() => {
                            setFile(null);
                            setFilePreview(null);
                          }}
                          aria-label="Batalkan file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Eye className="h-3.5 w-3.5" /> Periksa pratinjau sebelum kirim — {file?.name}
                        </p>
                        <Button className="rounded-full" onClick={submitReceipt} disabled={uploading}>
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                          Kirim untuk Verifikasi AI
                        </Button>
                      </div>
                    </div>
                  )}
                  {scanResult && (
                    <p className="mt-4 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">{scanResult}</p>
                  )}
                  <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      Bukti diproses AI Receipt Scanner milik seller (BYOK) — nominal, tanggal, dan nama pengirim
                      dibaca secara terstruktur. File disimpan terenkripsi maks 30 hari.
                    </p>
                    <p className="flex items-start gap-2">
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Timestamp bukti harus berada dalam jendela sesi: sejak Bayar Sekarang hingga batas kedaluwarsa order.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Booked — jalur manual / WA fallback */}
        {order.status === "payment_submitted" && (order.verifyPath === "manual" || order.verifyPath === "wa") && (
          <motion.div
            key="booked"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card mt-6 p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Handshake className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-bold">Order kamu berstatus Booked</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {order.verifyPath === "wa"
                    ? "Verifikasi AI gagal total (kedua key seller bermasalah). Order masuk antrian \"Perlu Tindakan\" seller."
                    : "Toko ini memverifikasi manual — seller akan memeriksa bukti transfermu dengan checklist."}
                  {order.verifyPath === "wa" && " Kamu bisa menghubungi seller langsung:"}
                </p>
                {order.waLink && (
                  <a
                    href={order.waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
                  >
                    <MessageCircle className="h-4 w-4" /> Hubungi via WhatsApp
                  </a>
                )}
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Tanpa respons seller 24 jam, order batal otomatis dan kamu boleh reorder.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Menunggu verifikasi AI */}
        {order.status === "payment_submitted" && order.verifyPath === "ai" && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card mt-6 flex flex-col items-center p-8 text-center"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h2 className="mt-4 text-lg font-bold">Bukti sedang diverifikasi AI…</h2>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              AI Receipt Scanner sedang mencocokkan nominal, waktu transfer, dan integritas bukti.
              Hasil akan muncul otomatis di halaman ini.
            </p>
          </motion.div>
        )}

        {/* Lunas — akses file */}
        {(order.status === "verified" || order.status === "completed") && (
          <motion.div
            key="lunas"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card mt-6 p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-bold">Pembayaran terverifikasi — Lunas</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  File produk v{order.product.version} siap diunduh. Link Google Drive tidak pernah
                  tampil mentah — file di-stream langsung oleh server Althentic.
                </p>
                {canDownload ? (
                  <Button className="mt-5 h-12 rounded-2xl px-6 text-base font-semibold" onClick={download} disabled={downloading}>
                    {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                    Unduh File (kuota 1x)
                  </Button>
                ) : (
                  <Button variant="outline" className="mt-5 h-12 rounded-2xl px-6" disabled>
                    <Lock className="h-4 w-4" /> Sudah diunduh — kuota 1x terpakai
                  </Button>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Unduhan terputus tidak mendapat kuota tambahan otomatis — ajukan dispute bila diperlukan.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Rejected — upload ulang */}
        {order.status === "rejected" && order.latestReceipt && (
          <motion.div
            key="rejected"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card mt-6 p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400">
                <CircleAlert className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-bold">Verifikasi gagal</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Bukti terakhir ditolak ({order.latestReceipt.matchStatus}). Upload bukti baru di panel
                  pembayaran di bawah sebelum order kedaluwarsa — nominal harus persis sama.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Batal / Kedaluwarsa */}
        {(order.status === "cancelled" || order.status === "expired") && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card mt-6 p-6 text-center md:p-8"
          >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-500/15 text-neutral-500">
              <Ban className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-bold">
              {order.status === "cancelled" ? "Order dibatalkan" : "Order kedaluwarsa"}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {order.status === "cancelled" ? (order as { cancelReason?: string }).cancelReason ?? "Dibatalkan" : "Tidak ada progres dalam 24 jam."} Kamu bisa
              order ulang kapan saja.
            </p>
            <Button
              variant="outline"
              className="mt-5 rounded-full"
              onClick={() => navigate({ v: "product", id: order.product.slug }, { reset: true })}
            >
              <RefreshCw className="h-4 w-4" /> Order Ulang
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aksi bawah */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate({ v: "orders" }, { reset: true })}>
          <ExternalLink className="h-4 w-4" /> Semua Pesanan
        </Button>
        {canCancel && !expired && (
          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={cancel}>
            Batalkan Order (1 klik)
          </Button>
        )}
        {(order.status === "completed" || order.status === "verified") && (
          <DisputeButton orderId={order.id} />
        )}
      </div>

      {/* Bukti terakhir (info pendukung) */}
      {order.latestReceipt && order.latestReceipt.amount != null && (
        <div className="glass-card mt-6 p-5 text-sm">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <FileImage className="h-4 w-4" /> Data bukti terakhir (ekstraksi terstruktur)
          </h3>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Nominal terbaca</dt>
              <dd className="font-semibold">{formatRupiah(order.latestReceipt.amount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Nama pengirim</dt>
              <dd className="font-semibold">{order.latestReceipt.senderName ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Waktu transfer</dt>
              <dd className="font-semibold">
                {order.latestReceipt.transferAt ? formatDate(order.latestReceipt.transferAt, true) : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status match</dt>
              <dd className="font-semibold">{order.latestReceipt.matchStatus ?? "—"}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

// ---- Timeline stepper (SPEC-04-05: 6 status + timestamp tiap perubahan) ----
function OrderTimeline({ order }: { order: OrderDTO }) {
  const stepLabels = [
    { key: "pending_payment", label: "Menunggu Pembayaran" },
    { key: "payment_submitted", label: order.verifyPath === "manual" || order.verifyPath === "wa" ? "Booked" : "Menunggu Verifikasi" },
    { key: "verified", label: "Lunas" },
    { key: "completed", label: "Selesai" },
  ];
  const terminal =
    order.status === "cancelled"
      ? { label: "Dibatalkan", reason: order.cancelReason }
      : order.status === "expired"
        ? { label: "Kedaluwarsa", reason: "Tanpa progres 24 jam" }
        : null;

  const statusOrder = ["pending_payment", "payment_submitted", "verified", "completed"];
  const activeIdx = terminal ? -1 : statusOrder.indexOf(order.status);

  return (
    <div className="glass-card mt-6 p-6">
      <ol className="relative space-y-0">
        {stepLabels.map((s, i) => {
          const event = order.events.find((e) => e.status === s.key);
          const done = activeIdx >= i;
          const current = activeIdx === i;
          return (
            <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
              {i < stepLabels.length - 1 && (
                <span
                  className={`stepper-line absolute left-[15px] top-8 h-full w-0.5 ${done && !current ? "opacity-100" : "opacity-25"}`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                } ${current ? "ring-4 ring-primary/20" : ""}`}
                aria-current={current ? "step" : undefined}
              >
                {done ? <BadgeCheck className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
              </span>
              <div className="pt-1">
                <p className={`text-sm font-semibold ${done ? "" : "text-muted-foreground"}`}>{s.label}</p>
                {event && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(event.createdAt, true)} · {timeAgo(event.createdAt)}
                    {event.note ? ` — ${event.note}` : ""}
                  </p>
                )}
              </div>
            </li>
          );
        })}
        {terminal && (
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400">
              <Ban className="h-4 w-4" />
            </span>
            <div className="pt-1">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">{terminal.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{String(terminal.reason)}</p>
            </div>
          </li>
        )}
      </ol>
    </div>
  );
}

function DisputeButton({ orderId }: { orderId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("refund_inaccessible");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await api<{ code: string }>("/api/reports?dispute=1", {
        method: "POST",
        json: { orderId, title, body, category },
      });
      toast({ title: "Dispute diajukan", description: `Kode dispute: ${res.code}. Tim kami akan memediasi.` });
      setOpen(false);
    } catch (err) {
      toast({ title: "Gagal mengajukan", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const CATS = [
    { id: "refund_inaccessible", label: "File tidak bisa diakses" },
    { id: "refund_mismatch", label: "Isi berbeda drastis dari deskripsi" },
    { id: "no_response", label: "Seller tidak merespons" },
    { id: "other", label: "Lainnya" },
  ];

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Ajukan Dispute (7 hari)
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal>
          <div className="glass-strong max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl p-6">
            <h2 className="text-lg font-bold">Ajukan Dispute</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Batas waktu: 7 hari setelah transaksi selesai. Refund dieksekusi manual di luar sistem —
              Althentic berperan sebagai mediator.
            </p>
            <div className="mt-4 space-y-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background/60 px-3 text-sm"
                aria-label="Kategori dispute"
              >
                {CATS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <input
                className="h-11 w-full rounded-xl border border-input bg-background/60 px-3 text-sm"
                placeholder="Judul singkat masalah"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                minLength={5}
              />
              <textarea
                className="min-h-28 w-full rounded-xl border border-input bg-background/60 p-3 text-sm"
                placeholder="Jelaskan masalahmu (bisa lampirkan bukti via email ke tim)"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                minLength={10}
              />
              <div className="flex gap-2">
                <Button className="flex-1 rounded-xl" onClick={submit} disabled={loading || title.length < 5 || body.length < 10}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />} Kirim Dispute
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
                  Batal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
