"use client";

// =============================================================================
// SellerDashboard — dashboard seller:
// - Overview: 4 kartu analytics + grafik 30 hari + 5 produk teratas (SPEC-02-08)
// - Produk: CRUD + kirim verifikasi + arsip/unarchive + laporan inspeksi (SPEC-02-09, SPEC-08-03)
// - Order: filter default Menunggu Verifikasi + Booked; badge Perlu Tindakan;
//   checklist 3 item approve manual (SPEC-02-05/06)
// - Komisi: Commission Owed + invoice + ledger + banner kuning 3 hari (SPEC-09-*)
// - Toko: branding (banner 4:1, aksen 8 preset, sosmed) + BYOK rotasi (SPEC-02-02..04, 07-09)
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive } from "@/components/animate-ui/icons/archive";
import { BadgeCheck } from "@/components/animate-ui/icons/badge-check";
import { ChartColumn as BarChart3 } from "@/components/animate-ui/icons/chart-column";
import { Bell } from "@/components/animate-ui/icons/bell";
import { CircleCheckBig as CheckCircle2 } from "@/components/animate-ui/icons/circle-check-big";
import { ChevronUp } from "@/components/animate-ui/icons/chevron-up";
import { Coins } from "@/components/animate-ui/icons/coins";
import { Eye } from "@/components/animate-ui/icons/eye";
import { FileSearch } from "@/components/animate-ui/icons/file-search";
import { FlaskConical } from "@/components/animate-ui/icons/flask-conical";
import { ImagePlus } from "@/components/animate-ui/icons/image-plus";
import { KeyRound } from "@/components/animate-ui/icons/key-round";
import { LoaderCircle as Loader2 } from "@/components/animate-ui/icons/loader-circle";
import { Package } from "@/components/animate-ui/icons/package";
import { PackagePlus } from "@/components/animate-ui/icons/package-plus";
import { Pencil } from "@/components/animate-ui/icons/pencil";
import { RefreshCw } from "@/components/animate-ui/icons/refresh-cw";
import { Send } from "@/components/animate-ui/icons/send";
import { Store } from "@/components/animate-ui/icons/store";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { TrendingUp } from "@/components/animate-ui/icons/trending-up";
import { TriangleAlert } from "@/components/animate-ui/icons/triangle-alert";
import { Wallet } from "@/components/animate-ui/icons/wallet";
import { X } from "@/components/animate-ui/icons/x";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { CATEGORIES, SELL_TYPES, ACCENT_PRESETS, orderStatusLabel, productStatusLabel, sellTypeLabel } from "@/lib/constants";
import { formatRupiah, formatRating, timeAgo, formatDate, slugify } from "@/lib/format";
import type { SellerStatsDTO, InvoiceDTO } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "products", label: "Produk", icon: Package },
  { id: "orders", label: "Order", icon: Bell },
  { id: "commissions", label: "Komisi & Tagihan", icon: Wallet },
  { id: "store", label: "Pengaturan Toko", icon: Store },
];

interface ProductRow {
  id: string;
  title: string;
  description: string;
  slug: string;
  category: string;
  status: string;
  minPrice: number;
  sellTypes: { type: string; price: number; driveFileId?: string }[];
  preview: string | null;
  previewCount: number;
  liveDemoUrl?: string | null;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
  version: number;
  rejectedReason?: string | null;
  latestInspection?: string | null;
  createdAt: string;
}

interface SellerOrder {
  id: string;
  code: string;
  status: string;
  verifyPath?: string | null;
  price: number;
  product: { title: string; slug: string; preview: string | null };
  buyerName: string;
  createdAt: string;
  latestReceipt: {
    amount?: number | null;
    senderName?: string | null;
    transferAt?: string | null;
    matchStatus?: string | null;
    manipulationSuspected?: boolean;
    receiptUrl: string | null;
  } | null;
}

export function SellerDashboard() {
  const { query, navigate } = useAppRouter();
  const tab = query.tab || "overview";

  return (
    <div className="container-page py-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard Seller</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola produk, order, dan komisi tokomu.</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl bg-muted p-1" role="tablist" aria-label="Bagian dashboard">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => navigate({ v: "dashboard", tab: t.id })}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && <OverviewTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "commissions" && <CommissionsTab />}
        {tab === "store" && <StoreTab />}
      </div>
    </div>
  );
}

// ============================ OVERVIEW (SPEC-02-08) ============================
function OverviewTab() {
  const [stats, setStats] = useState<SellerStatsDTO | null>(null);

  useEffect(() => {
    api<SellerStatsDTO>("/api/seller/analytics")
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-3xl" />
        ))}
        <Skeleton className="h-72 rounded-3xl sm:col-span-2 lg:col-span-4" />
      </div>
    );
  }

  const cards = [
    { label: "Transaksi Terverifikasi", value: String(stats.verifiedTx), icon: BadgeCheck, tint: "text-emerald-500" },
    { label: "Revenue Kotor", value: formatRupiah(stats.grossRevenue), icon: TrendingUp, tint: "text-primary" },
    { label: "Commission Owed Berjalan", value: formatRupiah(stats.commissionOwed), icon: Coins, tint: "text-amber-500" },
    { label: "Produk Terlaris", value: stats.topProduct?.title ?? "—", icon: Package, tint: "text-primary", small: true },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <c.icon className={`h-5 w-5 ${c.tint}`} aria-hidden />
            </div>
            <p className={`mt-3 font-bold ${c.small ? "line-clamp-2 text-base" : "text-2xl"}`}>{c.value}</p>
            {c.small && stats.topProduct && (
              <p className="mt-1 text-xs text-muted-foreground">{stats.topProduct.sales} terjual</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Grafik 30 hari */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-bold">Transaksi 30 Hari Terakhir</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: string) => v.slice(5)}
                interval={4}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={28} />
              <RechartsTooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 12 }}
                labelFormatter={(v: string) => formatDate(v)}
              />
              <Line type="monotone" dataKey="tx" name="Transaksi" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="revenue" name="Revenue (Rp)" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5 produk teratas */}
      <div className="glass-card overflow-hidden">
        <h2 className="p-5 pb-3 text-sm font-bold">5 Produk Teratas</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-2.5 font-semibold">Produk</th>
              <th className="px-3 py-2.5 font-semibold">Terjual</th>
              <th className="px-5 py-2.5 text-right font-semibold">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {stats.topProducts.map((p) => (
              <tr key={p.slug} className="border-t border-border/40">
                <td className="px-5 py-3 font-medium">{p.title}</td>
                <td className="px-3 py-3 text-muted-foreground">{p.sales}</td>
                <td className="px-5 py-3 text-right font-semibold">{formatRupiah(p.revenue)}</td>
              </tr>
            ))}
            {stats.topProducts.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">
                  Belum ada transaksi terverifikasi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================ PRODUK ============================
function ProductsTab() {
  const { navigate } = useAppRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [inspectOpen, setInspectOpen] = useState<ProductRow | null>(null);
  const [editing, setEditing] = useState<ProductRow | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ products: ProductRow[] }>("/api/seller/products");
      setProducts(res.products);
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async: setState hanya setelah await
    load();
  }, [load]);

  const submit = async (p: ProductRow) => {
    try {
      const res = await api<{ autoRejected: boolean; message: string }>(`/api/seller/products/${p.id}/submit`, { method: "POST" });
      toast({ title: res.autoRejected ? "Produk ditolak otomatis" : "Dikirim untuk verifikasi", description: res.message });
      load();
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    }
  };

  const archive = async (p: ProductRow) => {
    try {
      await api(`/api/seller/products/${p.id}`, { method: "DELETE" });
      toast({ title: "Produk diarsipkan", description: "Histori order & statistik tetap tersedia." });
      load();
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    }
  };

  const unarchive = async (p: ProductRow) => {
    try {
      await api(`/api/seller/products/${p.id}?unarchive=1`, { method: "DELETE" });
      toast({ title: "Produk dikembalikan ke draft" });
      load();
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Verifikasi produk menilai legalitas &amp; keamanan (link hidup, deskripsi tidak menipu) — bukan kualitas isi prompt (GAP-07).
        </p>
        <Button className="rounded-full" onClick={() => setCreating(true)}>
          <PackagePlus className="h-4 w-4" /> Produk Baru
        </Button>
      </div>

      {!products ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}</div>
      ) : products.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">Belum ada produk</p>
          <p className="mt-1 text-sm text-muted-foreground">Tambahkan produk pertamamu dan kirim untuk verifikasi.</p>
          <Button className="mt-5 rounded-full" onClick={() => setCreating(true)}>
            <PackagePlus className="h-4 w-4" /> Produk Baru
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              {p.preview ? (
                <img src={p.preview} alt="" className="h-16 w-full rounded-2xl object-cover sm:h-16 sm:w-24" />
              ) : (
                <span className="bg-brand-gradient flex h-16 w-full items-center justify-center rounded-2xl sm:w-24">
                  <Package className="h-6 w-6 text-white/80" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={p.status} />
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {SELL_TYPES.find((c) => c.id === p.category)?.label ?? CATEGORIES.find((c) => c.id === p.category)?.label}
                  </span>
                  <span className="text-xs text-muted-foreground">v{p.version}</span>
                </div>
                <button className="mt-1 block truncate text-left font-semibold hover:text-primary" onClick={() => navigate({ v: "product", id: p.slug })}>
                  {p.title}
                </button>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatRupiah(p.minPrice)} · {p.salesCount} terjual · {formatRating(p.ratingAvg, p.ratingCount)}
                </p>
                {p.status === "rejected" && p.rejectedReason && (
                  <p className="mt-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400">
                    Ditolak: {p.rejectedReason} — perbaiki &amp; kirim ulang (tenggat 14 hari).
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {p.latestInspection && (
                  <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setInspectOpen(p)}>
                    <FileSearch className="h-4 w-4" /> Laporan
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setEditing(p)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                {["draft", "rejected", "unlisted"].includes(p.status) && (
                  <Button size="sm" className="rounded-xl" onClick={() => submit(p)}>
                    <Send className="h-4 w-4" /> Kirim Verifikasi
                  </Button>
                )}
                {p.status === "active" && (
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => archive(p)}>
                    <Archive className="h-4 w-4" /> Arsip
                  </Button>
                )}
                {p.status === "archived" && (
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => unarchive(p)}>
                    <RefreshCw className="h-4 w-4" /> Unarchive
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialog buat produk */}
      {creating && <ProductForm onClose={() => setCreating(false)} onCreated={load} />}
      {editing && (
        <ProductForm
          onClose={() => setEditing(null)}
          onCreated={load}
          initial={editing}
        />
      )}

      {/* Dialog laporan inspeksi */}
      <AnimatePresence>
        {inspectOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal
            onClick={() => setInspectOpen(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-strong max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Laporan Inspeksi — {inspectOpen.title}</h2>
                <Button variant="ghost" size="icon" onClick={() => setInspectOpen(null)} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <FlaskConical className="mt-4 h-6 w-6 text-primary" />
              <pre className="mt-2 whitespace-pre-wrap rounded-2xl bg-muted/60 p-4 text-xs leading-relaxed">
                {inspectOpen.latestInspection}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-neutral-500/10 text-neutral-500",
    pending_verification: "bg-primary/10 text-primary",
    rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    archived: "bg-neutral-500/10 text-neutral-400",
    unlisted: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    suspended: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${styles[status] ?? styles.draft}`}>
      {productStatusLabel(status)}
    </span>
  );
}

// Form produk (buat/edit)
function ProductForm({
  onClose,
  onCreated,
  initial,
}: {
  onClose: () => void;
  onCreated: () => void;
  initial?: ProductRow;
}) {
  const { toast } = useToast();
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "website");
  const [liveDemoUrl, setLiveDemoUrl] = useState(initial?.liveDemoUrl ?? "");
  const [sellTypes, setSellTypes] = useState<{ type: string; price: string; driveFileId: string }[]>(
    initial?.sellTypes?.map((s) => ({ type: s.type, price: String(s.price), driveFileId: s.driveFileId ?? "" })) ?? [
      { type: "prompt", price: "", driveFileId: "" },
    ]
  );
  const [previews, setPreviews] = useState<{ dataUrl: string; base64: string; name: string }[]>([]);
  const [versionNote, setVersionNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const requiresDemo = useMemo(
    () => category === "website" && sellTypes.some((s) => s.type === "template" || s.type === "bundle"),
    [category, sellTypes]
  );

  const pickPreviews = (files: FileList | null) => {
    if (!files) return;
    const next = [...previews];
    for (const f of Array.from(files)) {
      if (next.length >= 5) break; // maks 5 gambar (GAP-14)
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) continue;
      if (f.size > 5 * 1024 * 1024) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        next.push({ dataUrl: url, base64: url.split(",")[1], name: f.name });
        setPreviews([...next]);
      };
      reader.readAsDataURL(f);
    }
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const st = sellTypes
        .filter((s) => s.driveFileId.trim().length >= 3)
        .map((s) => ({ type: s.type, price: parseInt(s.price || "0", 10) || 0, driveFileId: s.driveFileId.trim() }));
      if (st.length === 0) throw new Error("Isi ID file Google Drive minimal untuk satu tipe jual.");
      if (requiresDemo && !liveDemoUrl) throw new Error("Live demo wajib untuk tipe yang menyertakan template jadi.");

      if (isEdit) {
        await api(`/api/seller/products/${initial!.id}`, {
          method: "PUT",
          json: {
            title,
            description,
            liveDemoUrl: liveDemoUrl || null,
            sellTypes: st,
            versionNote: versionNote || undefined,
          },
        });
        toast({ title: "Produk diperbarui" });
      } else {
        if (previews.length === 0) throw new Error("Unggah minimal 1 gambar preview.");
        await api("/api/seller/products", {
          method: "POST",
          json: {
            title,
            description,
            category,
            sellTypes: st,
            liveDemoUrl: liveDemoUrl || null,
            previewBase64: previews.map((p) => p.base64),
          },
        });
        toast({ title: "Produk dibuat (draft)", description: "Kirim untuk verifikasi agar tampil publik." });
      }
      onCreated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-10" role="dialog" aria-modal>
      <motion.div
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-strong w-full max-w-2xl rounded-3xl p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{isEdit ? `Edit: ${initial!.title}` : "Produk Baru"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Tutup">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pf-title">Judul</Label>
              <Input id="pf-title" className="h-11 rounded-xl" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mis. Prompt Riset Pasar Lengkap" disabled={isEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory} disabled={isEdit}>
                <SelectTrigger className="h-11 rounded-xl" aria-label="Kategori produk">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isEdit && category !== "website" && (
                <p className="text-xs text-muted-foreground">Kategori ini hanya menjual tipe Prompt (GAP-14).</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-desc">Deskripsi</Label>
            <Textarea id="pf-desc" className="min-h-28" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Jelaskan isi, cara pakai, dan hasil yang buyer dapatkan…" />
          </div>

          {/* Tipe jual (hanya kategori website yang bisa >1 — GAP-14) */}
          <div>
            <Label>Tipe jual &amp; harga</Label>
            {category !== "website" && !isEdit && (
              <p className="mt-1 text-xs text-muted-foreground">Kategori non-Website: satu tipe Prompt.</p>
            )}
            <div className="mt-2 space-y-2">
              {sellTypes.map((s, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border p-3">
                  <Select
                    value={s.type}
                    onValueChange={(v) => {
                      const next = [...sellTypes];
                      next[idx] = { ...next[idx], type: v };
                      setSellTypes(next);
                    }}
                    disabled={isEdit || category !== "website"}
                  >
                    <SelectTrigger className="h-10 w-[160px] rounded-xl" aria-label={`Tipe jual ${idx + 1}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SELL_TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-10 w-32 rounded-xl"
                    placeholder="Harga Rp"
                    inputMode="numeric"
                    value={s.price}
                    onChange={(e) => {
                      const next = [...sellTypes];
                      next[idx] = { ...next[idx], price: e.target.value.replace(/\D/g, "") };
                      setSellTypes(next);
                    }}
                    aria-label={`Harga tipe ${idx + 1}`}
                  />
                  <Input
                    className="h-10 flex-1 rounded-xl font-mono text-sm"
                    placeholder="ID file Google Drive (dari link uc?export=download&id=…)"
                    value={s.driveFileId}
                    onChange={(e) => {
                      let v = e.target.value.trim();
                      const m = v.match(/[?&]id=([\w-]+)/);
                      if (m) v = m[1];
                      const next = [...sellTypes];
                      next[idx] = { ...next[idx], driveFileId: v };
                      setSellTypes(next);
                    }}
                    aria-label={`ID file Drive tipe ${idx + 1}`}
                  />
                  {sellTypes.length > 1 && !isEdit && (
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={() => setSellTypes(sellTypes.filter((_, i) => i !== idx))} aria-label="Hapus tipe">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {category === "website" && !isEdit && sellTypes.length < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    const remaining = SELL_TYPES.filter((t) => !sellTypes.some((s) => s.type === t.id));
                    if (remaining[0]) setSellTypes([...sellTypes, { type: remaining[0].id, price: "", driveFileId: "" }]);
                  }}
                >
                  <PackagePlus className="h-4 w-4" /> Tambah tipe jual
                </Button>
              )}
            </div>
          </div>

          {/* Live demo */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-demo">URL Live demo {requiresDemo && <span className="text-destructive">(wajib)</span>}</Label>
            <Input id="pf-demo" className="h-11 rounded-xl" value={liveDemoUrl} onChange={(e) => setLiveDemoUrl(e.target.value)} placeholder="https://demo-produkmu.vercel.app" />
            <p className="text-xs text-muted-foreground">Wajib hanya untuk tipe yang menyertakan template jadi.</p>
          </div>

          {/* Preview (maks 5 — GAP-14) */}
          {!isEdit && (
            <div>
              <Label>Preview gambar (maks 5, JPG/PNG/WEBP, 5MB)</Label>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => pickPreviews(e.target.files)} aria-label="Pilih gambar preview" />
              <div className="mt-2 flex flex-wrap gap-2">
                {previews.map((p, i) => (
                  <div key={i} className="relative">
                    <img src={p.dataUrl} alt={`Preview ${i + 1}`} className="h-20 w-28 rounded-xl object-cover" />
                    <button
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-background p-1 shadow-md"
                      onClick={() => setPreviews(previews.filter((_, j) => j !== i))}
                      aria-label={`Hapus preview ${i + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {previews.length < 5 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50"
                    aria-label="Tambah preview"
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[10px]">Tambah</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="pf-vnote">Catatan versi (opsional)</Label>
              <Input id="pf-vnote" className="h-11 rounded-xl" value={versionNote} onChange={(e) => setVersionNote(e.target.value)} placeholder="mis. Revisi ZIP inti v2" />
              <p className="text-xs text-muted-foreground">
                Perubahan ID file Drive menaikkan versi &amp; memberi tahu buyer lama (hanya saat ZIP inti berubah — GAP-05).
              </p>
            </div>
          )}

          {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>Batal</Button>
            <Button className="flex-1 rounded-2xl" onClick={save} disabled={saving || title.length < 5 || description.length < 20}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} {isEdit ? "Simpan Perubahan" : "Buat Produk (Draft)"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================ ORDER (SPEC-02-05/06) ============================
const CHECKLIST_ITEMS = [
  "Nominal terlihat sesuai dengan harga order",
  "Nama / nomor pengirim terbaca di bukti",
  "Waktu transfer masuk akal dengan rentang order",
];

function OrdersTab() {
  const [filter, setFilter] = useState("action"); // default: Menunggu Verifikasi + Booked (SPEC-02-05)
  const [orders, setOrders] = useState<SellerOrder[] | null>(null);
  const [actionCount, setActionCount] = useState(0);
  const [checklist, setChecklist] = useState<Record<string, boolean[]>>({});
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ orders: SellerOrder[]; actionCount: number }>(`/api/seller/orders?filter=${filter}`);
      setOrders(res.orders);
      setActionCount(res.actionCount);
    } catch {
      setOrders([]);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async + polling
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (orderId: string, action: "approve" | "reject") => {
    const cl = checklist[orderId];
    if (action === "approve" && (!cl || !cl.every(Boolean))) {
      return; // tombol tidak aktif (SPEC-02-06)
    }
    const reason =
      action === "reject"
        ? prompt("Alasan penolakan (dikirim ke buyer):") ?? ""
        : undefined;
    if (action === "reject" && !reason) return;
    try {
      await api("/api/seller/orders", {
        method: "POST",
        json: { orderId, action, checklist: action === "approve" ? cl : undefined, reason },
      });
      toast2(action);
      load();
    } catch (err) {
      toast3(err as Error);
    }
  };

  const { toast } = useToast();
  const toast2 = (action: "approve" | "reject") =>
    toast({ title: action === "approve" ? "Order disetujui — buyer dapat mengakses file" : "Order ditolak" });
  const toast3 = (err: Error) => toast({ title: "Gagal", description: err.message, variant: "destructive" });

  const viewReceipt = async (orderId: string) => {
    try {
      const res = await api<{ url: string }>(`/api/seller/orders/${orderId}/receipt-preview`);
      setReceiptUrl(res.url);
    } catch (err) {
      toast({ title: "Gagal memuat bukti", description: (err as Error).message, variant: "destructive" });
    }
  };

  const filters = [
    { id: "action", label: `Perlu Tindakan${actionCount ? ` (${actionCount})` : ""}` },
    { id: "verifying", label: "Menunggu Verifikasi" },
    { id: "verified", label: "Lunas" },
    { id: "pending_payment", label: "Menunggu Pembayaran" },
    { id: "all", label: "Semua" },
  ];

  return (
    <div className="space-y-4">
      {/* Badge counter menonjol (SPEC-04-07) */}
      {actionCount > 0 && (
        <div className="glass-card flex items-center gap-3 border-primary/40 bg-primary/10 p-4">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {actionCount}
            </span>
          </span>
          <div>
            <p className="text-sm font-bold">{actionCount} order menunggu aksi manual kamu</p>
            <p className="text-xs text-muted-foreground">Batas respons 24 jam — tanpa respons, order batal otomatis (SPEC-02-07).</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
              filter === f.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!orders ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">Tidak ada order pada filter ini.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const isManualAction = o.status === "payment_submitted" && (o.verifyPath === "manual" || o.verifyPath === "wa");
            const cl = checklist[o.id] ?? [false, false, false];
            const allChecked = cl.every(Boolean);
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{o.code}</span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      {orderStatusLabel(o.status, o.verifyPath)}
                    </span>
                    {o.latestReceipt?.manipulationSuspected && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        <TriangleAlert className="h-3 w-3" /> indikasi manipulasi
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(o.createdAt)}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{o.product.title}</p>
                  <p className="text-sm">
                    <span className="font-bold text-primary">{formatRupiah(o.price)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      dari {o.buyerName} · {sellTypeLabel("prompt").length ? "" : ""}
                    </span>
                  </p>
                </div>

                {/* Data bukti terstruktur */}
                {o.latestReceipt && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-lg bg-muted px-2.5 py-1">
                      Nominal: <b>{o.latestReceipt.amount != null ? formatRupiah(o.latestReceipt.amount) : "—"}</b>
                    </span>
                    <span className="rounded-lg bg-muted px-2.5 py-1">
                      Pengirim: <b>{o.latestReceipt.senderName ?? "—"}</b>
                    </span>
                    <span className="rounded-lg bg-muted px-2.5 py-1">
                      Waktu: <b>{o.latestReceipt.transferAt ? formatDate(o.latestReceipt.transferAt, true) : "—"}</b>
                    </span>
                    {o.latestReceipt.receiptUrl && (
                      <button className="rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary hover:bg-primary/20" onClick={() => viewReceipt(o.id)}>
                        <Eye className="mr-1 inline h-3 w-3" /> Lihat bukti
                      </button>
                    )}
                  </div>
                )}

                {/* Checklist approve manual (SPEC-02-06) */}
                {isManualAction && (
                  <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Checklist wajib sebelum approve
                    </p>
                    <div className="mt-2.5 space-y-2">
                      {CHECKLIST_ITEMS.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <Checkbox
                            id={`${o.id}-${i}`}
                            checked={cl[i]}
                            onCheckedChange={(v) => {
                              const next = [...cl];
                              next[i] = v === true;
                              setChecklist({ ...checklist, [o.id]: next });
                            }}
                            className="mt-0.5"
                          />
                          <label htmlFor={`${o.id}-${i}`} className="text-sm leading-relaxed">{item}</label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button className="rounded-xl" size="sm" disabled={!allChecked} onClick={() => act(o.id, "approve")}>
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                      <Button variant="outline" className="rounded-xl text-destructive hover:bg-destructive/10" size="sm" onClick={() => act(o.id, "reject")}>
                        <X className="h-4 w-4" /> Reject
                      </Button>
                      {!allChecked && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ChevronUp className="h-3 w-3" /> Centang semua checklist untuk mengaktifkan Approve
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Viewer bukti (signed URL pendek) */}
      <AnimatePresence>
        {receiptUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal
            onClick={() => setReceiptUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="glass-strong max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between px-2">
                <p className="text-sm font-bold">Bukti Transfer (signed URL)</p>
                <Button variant="ghost" size="icon" onClick={() => setReceiptUrl(null)} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <img src={receiptUrl} alt="Bukti transfer" className="w-full rounded-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================ KOMISI (SPEC-09) ============================
interface CommissionsData {
  owed: number;
  uninvoicedOpen: number;
  commissionCredit: number;
  settledCount: number;
  invoices: InvoiceDTO[];
  ledger: { id: string; amount: number; status: string; orderCode: string; productTitle: string; createdAt: string }[];
  suspend: { reason: string | null; status: string; daysToSuspend: number | null; showYellowBanner: boolean };
}

function CommissionsTab() {
  const [data, setData] = useState<CommissionsData | null>(null);

  useEffect(() => {
    api<CommissionsData>("/api/seller/commissions")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
        <Skeleton className="h-64 rounded-3xl sm:col-span-3" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Banner kuning: sisa ≤3 hari sebelum suspend (SPEC-09-03) */}
      {data.suspend.showYellowBanner && (
        <div className="glass-card flex items-start gap-3 border-amber-400/60 bg-amber-400/15 p-5">
          <TriangleAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
          <div>
            <p className="font-bold text-amber-700 dark:text-amber-400">
              Tersisa {data.suspend.daysToSuspend} hari sebelum toko suspend otomatis
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Lunasi invoice komisi sekarang dan kirim bukti ke tim Althentic untuk verifikasi manual.
            </p>
          </div>
        </div>
      )}
      {data.suspend.status === "suspended" && (
        <div className="glass-card flex items-start gap-3 border-red-500/50 bg-red-500/10 p-5">
          <TriangleAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
          <div>
            <p className="font-bold text-red-600 dark:text-red-400">Toko sedang disuspend</p>
            <p className="mt-1 text-sm text-muted-foreground">{data.suspend.reason ?? "Tunggakan komisi melewati grace period."}</p>
          </div>
        </div>
      )}

      {/* Kartu ringkas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Commission Owed</p>
          <p className="mt-2 text-2xl font-bold text-amber-500">{formatRupiah(data.owed)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Terus bertambah dari transaksi baru (GAP-09)</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Belum Terfaktur</p>
          <p className="mt-2 text-2xl font-bold">{formatRupiah(data.uninvoicedOpen)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Invoice otomatis saat mencapai threshold Rp25.000</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saldo Kredit</p>
          <p className="mt-2 text-2xl font-bold text-emerald-500">{formatRupiah(data.commissionCredit)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Dari kelebihan pembayaran komisi (GAP-16)</p>
        </div>
      </div>

      {/* Invoice */}
      <div className="glass-card overflow-hidden">
        <h2 className="p-5 pb-3 text-sm font-bold">Invoice Komisi</h2>
        {data.invoices.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-muted-foreground">Belum ada invoice — terbit otomatis saat Commission Owed mencapai threshold.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-2.5 font-semibold">Invoice</th>
                <th className="px-3 py-2.5 font-semibold">Nominal</th>
                <th className="px-3 py-2.5 font-semibold">Batas Bayar</th>
                <th className="px-5 py-2.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-border/40">
                  <td className="px-5 py-3 font-mono text-xs">{inv.code}</td>
                  <td className="px-3 py-3 font-semibold">{formatRupiah(inv.amount)}</td>
                  <td className="px-3 py-3 text-muted-foreground">{formatDate(inv.suspendAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        inv.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {inv.status === "paid" ? "Lunas" : "Belum Lunas"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ledger per event */}
      <div className="glass-card overflow-hidden">
        <h2 className="p-5 pb-3 text-sm font-bold">Ledger Komisi (per event transaksi terverifikasi)</h2>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-popover/95 backdrop-blur">
              <tr className="border-t border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-2.5 font-semibold">Order</th>
                <th className="px-3 py-2.5 font-semibold">Produk</th>
                <th className="px-3 py-2.5 font-semibold">Komisi</th>
                <th className="px-5 py-2.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.ledger.map((l) => (
                <tr key={l.id} className="border-t border-border/40">
                  <td className="px-5 py-2.5 font-mono text-xs">{l.orderCode}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{l.productTitle}</td>
                  <td className="px-3 py-2.5 font-semibold">{formatRupiah(l.amount)}</td>
                  <td className="px-5 py-2.5 text-right">
                    <span
                      className={`text-[11px] font-bold ${
                        l.status === "settled"
                          ? "text-emerald-500"
                          : l.status === "invoiced"
                            ? "text-amber-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      {l.status === "settled" ? "Lunas" : l.status === "invoiced" ? "Terfaktur" : "Terbuka"}
                    </span>
                  </td>
                </tr>
              ))}
              {data.ledger.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                    Belum ada komisi tercatat — komisi hanya dicatat saat transaksi terverifikasi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================ SETTINGS TOKO (SPEC-02-02..04, 07-09) ============================
interface StoreSettings {
  name: string;
  slug: string;
  description: string;
  accentPreset: number;
  bannerUrl: string | null;
  qrUrl: string | null;
  whatsapp?: string;
  socialIg?: string | null;
  socialX?: string | null;
  socialTiktok?: string | null;
  aiProvider?: string;
  aiKeyPrimaryMask?: string | null;
  aiKeyFallbackMask?: string | null;
  aiKeyFailCount?: number;
}

function StoreTab() {
  const { toast } = useToast();
  const [store, setStore] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [bannerB64, setBannerB64] = useState<string | null>(null);
  const [qrB64, setQrB64] = useState<string | null>(null);
  const [key1, setKey1] = useState("");
  const [key2, setKey2] = useState("");
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    api<{ store: StoreSettings | null }>("/api/seller/store").then((r) => {
      setStore(r.store);
      setBannerPreview(r.store?.bannerUrl ?? null);
      setQrPreview(r.store?.qrUrl ?? null);
    });
  }, []);

  const pickImage = (f: File | null, kind: "banner" | "qr") => {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast({ title: "Maksimal 2 MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      if (kind === "banner") {
        setBannerPreview(url);
        setBannerB64(url.split(",")[1]);
      } else {
        setQrPreview(url);
        setQrB64(url.split(",")[1]);
      }
    };
    reader.readAsDataURL(f);
  };

  const save = async () => {
    if (!store) return;
    setSaving(true);
    try {
      await api("/api/seller/store", {
        method: "PUT",
        json: {
          name: store.name,
          description: store.description,
          accentPreset: store.accentPreset,
          whatsapp: store.whatsapp,
          socialIg: store.socialIg ?? undefined,
          socialX: store.socialX ?? undefined,
          socialTiktok: store.socialTiktok ?? undefined,
          bannerBase64: bannerB64 ?? undefined,
          qrBase64: qrB64 ?? undefined,
          qrVerified: qrB64 ? true : undefined,
        },
      });
      toast({ title: "Pengaturan toko disimpan" });
      setBannerB64(null);
      setQrB64(null);
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const rotateKey = async () => {
    setRotating(true);
    try {
      await api("/api/seller/store", {
        method: "POST",
        json: {
          aiProvider: store?.aiProvider ?? "gemini",
          aiKeyPrimary: key1 || undefined,
          aiKeyFallback: key2 || (key2 === "" ? undefined : key2),
        },
      });
      toast({ title: "Key diganti", description: "Key lama langsung nonaktif." });
      setKey1("");
      setKey2("");
      const r = await api<{ store: StoreSettings | null }>("/api/seller/store");
      setStore(r.store);
    } catch (err) {
      toast({ title: "Gagal rotasi key", description: (err as Error).message, variant: "destructive" });
    } finally {
      setRotating(false);
    }
  };

  if (!store) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Branding */}
      <section className="glass-card p-5 md:p-6" aria-labelledby="st-branding">
        <h2 id="st-branding" className="text-sm font-bold">Branding Toko</h2>

        {/* Banner 4:1 + preview desktop/mobile (SPEC-02-03) */}
        <div className="mt-4">
          <Label>Banner (1600×400, JPG/PNG ≤ 2 MB, dikonversi WebP)</Label>
          <input ref={bannerRef} type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => pickImage(e.target.files?.[0] ?? null, "banner")} aria-label="Pilih banner" />
          {bannerPreview ? (
            <div className="mt-2 space-y-2">
              <img src={bannerPreview} alt="Preview banner desktop" className="aspect-[4/1] w-full rounded-2xl object-cover" />
              {/* Preview mobile */}
              <div className="mx-auto w-40">
                <img src={bannerPreview} alt="Preview banner mobile" className="aspect-[4/3] w-full rounded-xl object-cover" />
                <p className="mt-1 text-center text-[10px] text-muted-foreground">Tampilan mobile</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => bannerRef.current?.click()}>
                Ganti banner
              </Button>
            </div>
          ) : (
            <button
              onClick={() => bannerRef.current?.click()}
              className="mt-2 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 transition-all hover:border-primary/50"
            >
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">Unggah banner 1600×400</span>
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="st-name">Nama toko</Label>
            <Input id="st-name" className="h-11 rounded-xl" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-slug">Slug (permanen)</Label>
            <Input id="st-slug" className="h-11 rounded-xl font-mono text-sm" value={store.slug} disabled />
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="st-desc">Deskripsi (maks 500)</Label>
          <Textarea id="st-desc" className="min-h-20" value={store.description ?? ""} onChange={(e) => setStore({ ...store, description: e.target.value.slice(0, 500) })} />
        </div>

        {/* 8 preset aksen (SPEC-02-02) */}
        <div className="mt-4">
          <Label>Warna aksen (banner, badge, CTA toko saja)</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setStore({ ...store, accentPreset: p.id })}
                aria-label={`Aksen ${p.name}`}
                aria-pressed={store.accentPreset === p.id}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-all ${
                  store.accentPreset === p.id ? "border-primary" : "border-border hover:border-primary/40"
                }`}
              >
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: p.hex }} />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="st-wa">WhatsApp</Label>
            <Input id="st-wa" className="h-11 rounded-xl" value={store.whatsapp ?? ""} onChange={(e) => setStore({ ...store, whatsapp: e.target.value })} placeholder="08123456789" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="st-ig">Instagram</Label>
              <Input id="st-ig" className="h-11 rounded-xl" value={store.socialIg ?? ""} onChange={(e) => setStore({ ...store, socialIg: e.target.value })} placeholder="username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-x">X</Label>
              <Input id="st-x" className="h-11 rounded-xl" value={store.socialX ?? ""} onChange={(e) => setStore({ ...store, socialX: e.target.value })} placeholder="username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-tt">TikTok</Label>
              <Input id="st-tt" className="h-11 rounded-xl" value={store.socialTiktok ?? ""} onChange={(e) => setStore({ ...store, socialTiktok: e.target.value })} placeholder="username" />
            </div>
          </div>
        </div>

        <Button className="mt-5 rounded-2xl" onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan Branding
        </Button>
      </section>

      {/* QR */}
      <section className="glass-card p-5 md:p-6" aria-labelledby="st-qr">
        <h2 id="st-qr" className="text-sm font-bold">QR Pembayaran</h2>
        <input ref={qrRef} type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => pickImage(e.target.files?.[0] ?? null, "qr")} aria-label="Pilih QR" />
        <div className="mt-4 flex flex-wrap items-center gap-6">
          {qrPreview ? (
            <div className="relative">
              <img src={qrPreview} alt="QR pembayaran toko" className="h-40 w-40 rounded-2xl" />
            </div>
          ) : (
            <button
              onClick={() => qrRef.current?.click()}
              className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border transition-all hover:border-primary/50"
            >
              <ImagePlus className="h-7 w-7 text-muted-foreground" />
              <span className="text-xs font-medium">Unggah QR</span>
            </button>
          )}
          <div className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">
              QR bisnismu ditampilkan ke buyer saat checkout. JPG/PNG maks 2 MB.
            </p>
            <Button variant="outline" className="rounded-full" onClick={() => qrRef.current?.click()}>
              Ganti QR
            </Button>
          </div>
        </div>
      </section>

      {/* BYOK (SPEC-07-08/09) */}
      <section className="glass-card p-5 md:p-6" aria-labelledby="st-key">
        <h2 id="st-key" className="flex items-center gap-2 text-sm font-bold">
          <KeyRound className="h-4 w-4" /> API Key AI Receipt Scanner
        </h2>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-lg bg-muted px-3 py-1.5">Provider: <b>{store.aiProvider === "zai" ? "Z.AI Vision" : "Gemini BYOK"}</b></span>
            {store.aiKeyPrimaryMask && (
              <span className="rounded-lg bg-muted px-3 py-1.5 font-mono text-xs">Key: {store.aiKeyPrimaryMask}</span>
            )}
            {(store.aiKeyFailCount ?? 0) > 0 && (
              <span className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                Kegagalan key: {store.aiKeyFailCount}/3
              </span>
            )}
          </div>

          {store.aiProvider === "gemini" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="st-key1">Key primer baru</Label>
                <Input id="st-key1" type="password" className="h-11 rounded-xl font-mono text-sm" value={key1} onChange={(e) => setKey1(e.target.value)} placeholder="AIza…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="st-key2">Key fallback baru</Label>
                <Input id="st-key2" type="password" className="h-11 rounded-xl font-mono text-sm" value={key2} onChange={(e) => setKey2(e.target.value)} placeholder="AIza… (opsional)" />
              </div>
            </div>
          )}
          <p className="rounded-xl bg-primary/10 px-3.5 py-2.5 text-xs leading-relaxed text-primary">
            "Ganti key" menonaktifkan key lama langsung. 3 kegagalan beruntun memicu email pengingat rotasi.
            Key divalidasi dengan satu panggilan test murah dan dienkripsi AES-256-GCM.
          </p>
          {store.aiProvider === "gemini" && (
            <Button className="rounded-2xl" onClick={rotateKey} disabled={rotating || !key1}>
              {rotating && <Loader2 className="h-4 w-4 animate-spin" />} Ganti Key
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
