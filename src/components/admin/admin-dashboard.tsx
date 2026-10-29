"use client";

// =============================================================================
// AdminDashboard - Dashboard Super-Admin (Konteks Terkunci):
// - Overview: metrik ringkas + growth chart (MA7) + kategori terlaris + konsentrasi top-1
// - Analytics: periode default 7 hari + tab Today/7/30/90/Custom + CSV export (SPEC-01-*)
// - Seller: tabel lengkap + suspend/unsuspend
// - Verifikasi: tabel + filter + search + audit trail "Riwayat Verifikasi" + inspeksi + keputusan
// - Dispute: inbox Open/Investigating/Resolved + resolusi (GAP-18)
// - Invoice: verifikasi pembayaran komisi manual (SPEC-09-06)
// - Settings: komisi, threshold, suspend, template WA + uji pratinjau (SPEC-01-05..07)
// - Sistem: email log, token MCP, laporan abuse, jalankan maintenance
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity } from "@/components/animate-ui/icons/activity";
import { ChartColumn as BarChart3 } from "@/components/animate-ui/icons/chart-column";
import { Bot } from "@/components/animate-ui/icons/bot";
import { CircleCheckBig as CheckCircle2 } from "@/components/animate-ui/icons/circle-check-big";
import { Coins } from "@/components/animate-ui/icons/coins";
import { Download } from "@/components/animate-ui/icons/download";
import { FileSearch } from "@/components/animate-ui/icons/file-search";
import { FlaskConical } from "@/components/animate-ui/icons/flask-conical";
import { KeyRound } from "@/components/animate-ui/icons/key-round";
import { LifeBuoy } from "@/components/animate-ui/icons/life-buoy";
import { LoaderCircle as Loader2 } from "@/components/animate-ui/icons/loader-circle";
import { Mail } from "@/components/animate-ui/icons/mail";
import { Package } from "@/components/animate-ui/icons/package";
import { RefreshCw } from "@/components/animate-ui/icons/refresh-cw";
import { Settings as SettingsIcon } from "@/components/animate-ui/icons/settings";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { Store } from "@/components/animate-ui/icons/store";
import { TrendingUp } from "@/components/animate-ui/icons/trending-up";
import { Users } from "@/components/animate-ui/icons/users";
import { X } from "@/components/animate-ui/icons/x";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAppRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { categoryLabel, storeStatusLabel } from "@/lib/constants";
import { formatRupiah, timeAgo, formatDate } from "@/lib/format";
import type {
  AdminOverviewDTO,
  SellerRowDTO,
  VerificationItemDTO,
  AuditEntryDTO,
  DisputeDTO,
  InvoiceDTO,
  PlatformSettingsDTO,
} from "@/lib/types";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "sellers", label: "Seller", icon: Store },
  { id: "verifications", label: "Verifikasi Produk", icon: FlaskConical },
  { id: "disputes", label: "Dispute", icon: LifeBuoy },
  { id: "invoices", label: "Invoice Komisi", icon: Coins },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "system", label: "Sistem", icon: Activity },
];

export function AdminDashboard() {
  const { query, navigate } = useAppRouter();
  const tab = query.tab || "overview";

  return (
    <div className="container-page py-6 md:py-10">
      <div className="flex items-center gap-3">
        <span className="bg-brand-gradient flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard Super Admin</h1>
          <p className="text-sm text-muted-foreground">Single Super-Admin (hardcoded via environment) - akses penuh semua transaksi (GAP-06).</p>
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl bg-muted p-1" role="tablist" aria-label="Bagian admin">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => navigate({ v: "admin", tab: t.id })}
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
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "sellers" && <SellersTab />}
        {tab === "verifications" && <VerificationsTab />}
        {tab === "disputes" && <DisputesTab />}
        {tab === "invoices" && <InvoicesTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "system" && <SystemTab />}
      </div>
    </div>
  );
}

// ==================== OVERVIEW (Konteks Terkunci, SPEC-01-02/03, SPEC-16-03) ====================
function OverviewTab() {
  const [data, setData] = useState<AdminOverviewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    api<AdminOverviewDTO>("/api/admin/overview")
      .then(setData)
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div role="status" aria-label="Memuat ringkasan Super-Admin" aria-live="polite" aria-busy="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
    );
  }
  if (loadFailed || !data) {
    return <div role="alert" className="glass-card p-6 text-sm text-muted-foreground">Ringkasan Super-Admin tidak dapat dimuat. Coba muat ulang halaman.</div>;
  }

  const cards = [
    { label: "GMV Estimasi", value: formatRupiah(data.gmv), icon: TrendingUp, tint: "text-primary" },
    { label: "Transaksi Terverifikasi", value: String(data.verifiedTx), icon: CheckCircle2, tint: "text-emerald-500" },
    { label: "Komisi Tertagih vs Outstanding", value: `${formatRupiah(data.commissionCollected)} / ${formatRupiah(data.commissionOutstanding)}`, icon: Coins, tint: "text-amber-500", small: true },
    { label: "Seller Aktif vs Suspend", value: `${data.activeSellers} / ${data.suspendedSellers}`, icon: Store, tint: "text-primary" },
    { label: "Konsentrasi Top-1 Seller", value: `${data.topSellerConcentration}%`, icon: Users, tint: "text-muted-foreground" },
    { label: "Produk Aktif", value: String(data.totalProducts), icon: Package, tint: "text-muted-foreground" },
    { label: "Antrean Verifikasi", value: String(data.pendingVerifications), icon: FlaskConical, tint: "text-primary" },
    { label: "Dispute Terbuka", value: String(data.openDisputes), icon: LifeBuoy, tint: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <c.icon className={`h-5 w-5 shrink-0 ${c.tint}`} aria-hidden />
            </div>
            <p className={`mt-2.5 font-bold ${c.small ? "text-base" : "text-2xl"}`}>{c.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Growth chart + MA7 (SPEC-01-03) */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-bold">Tren Transaksi 30 Hari + Moving Average 7 Hari</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chart}>
              <defs>
                <linearGradient id="gTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v: string) => v.slice(5)} interval={4} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={28} />
              <RechartsTooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 12 }}
                labelFormatter={(v: string) => formatDate(v)}
              />
              <Area type="monotone" dataKey="tx" name="Transaksi" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gTx)" />
              <Line type="monotone" dataKey="ma7" name="MA 7 hari" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="6 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Line chart harian tetap ditampilkan meski data kecil, plus MA7 sebagai baseline tren (SPEC-01-03).
        </p>
      </div>

      {/* Kategori terlaris + konsentrasi */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold">Kategori Terlaris</h2>
          <div className="mt-4 space-y-3">
            {data.topCategories.map((c) => {
              const max = data.topCategories[0]?.count ?? 1;
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{categoryLabel(c.category)}</span>
                    <span className="text-muted-foreground">{c.count} transaksi</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="bg-brand-gradient h-full rounded-full" style={{ width: `${(c.count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
            {data.topCategories.length === 0 && <p className="text-sm text-muted-foreground">Belum ada transaksi terverifikasi.</p>}
          </div>
        </div>
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold">Sinyal Rekrutmen Seller</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Konsentrasi top-1 seller saat ini <b className="text-foreground">{data.topSellerConcentration}%</b> dari
            seluruh transaksi terverifikasi (SPEC-16-03). Angka tinggi = sinyal mempercepat rekrutmen seller,
            tanpa pembatasan eksplisit terhadap seller produktif.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Buyer terdaftar: <b className="text-foreground">{data.totalBuyers}</b> · Invoice outstanding:{" "}
            <b className="text-foreground">{data.outstandingInvoices}</b>
          </p>
        </div>
      </div>
    </div>
  );
}

// ==================== ANALYTICS (SPEC-01-01..04) ====================
function AnalyticsTab() {
  const [range, setRange] = useState("7d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<{
    gmv: number;
    verifiedTx: number;
    commissionCollected: number;
    commissionOutstanding: number;
    activeSellers: number;
    suspendedSellers: number;
    sellerRatio: number;
    chart: { date: string; tx: number; ma7: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sp = new URLSearchParams({ range });
    if (range === "custom" && from && to) {
      sp.set("from", from);
      sp.set("to", to);
    }
    api<typeof data>(`/api/admin/analytics?${sp}`)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, from, to]);

  const ranges = [
    { id: "today", label: "Hari ini" },
    { id: "7d", label: "7 hari" },
    { id: "30d", label: "30 hari" },
    { id: "90d", label: "90 hari" },
    { id: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-5">
      {/* Tab cepat periode (SPEC-01-01) */}
      <div className="flex flex-wrap items-center gap-2">
        {ranges.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setData(null);
              setLoading(true);
              setLoadFailed(false);
              setRange(r.id);
            }}
            aria-pressed={range === r.id}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              range === r.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {r.label}
          </button>
        ))}
        {range === "custom" && (
          <div className="flex items-center gap-2">
            <Input type="date" value={from} onChange={(e) => { setData(null); setLoading(true); setLoadFailed(false); setFrom(e.target.value); }} className="h-10 rounded-xl" aria-label="Dari tanggal" />
            <span className="text-muted-foreground">→</span>
            <Input type="date" value={to} onChange={(e) => { setData(null); setLoading(true); setLoadFailed(false); setTo(e.target.value); }} className="h-10 rounded-xl" aria-label="Sampai tanggal" />
          </div>
        )}
      </div>

      {!data && loading ? (
        <div role="status" aria-label="Memuat analitik Super-Admin" aria-live="polite" aria-busy="true" className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}</div>
      ) : !data ? (
        <div role="alert" className="glass-card p-6 text-sm text-muted-foreground">Analitik Super-Admin tidak dapat dimuat. Coba ubah rentang waktu atau muat ulang halaman.</div>
      ) : (
        <>
          {loadFailed && <div role="alert" className="glass-card p-4 text-sm text-muted-foreground">Permintaan rentang waktu terbaru gagal. Data sebelumnya masih ditampilkan.</div>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "GMV Estimasi", value: formatRupiah(data.gmv) },
              { label: "Transaksi Terverifikasi", value: String(data.verifiedTx) },
              { label: "Komisi Tertagih", value: formatRupiah(data.commissionCollected) },
              { label: "Komisi Outstanding", value: formatRupiah(data.commissionOutstanding) },
            ].map((c) => (
              <div key={c.label} className="glass-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
                <p className="mt-2 text-xl font-bold">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="glass-card p-5">
            <h2 className="text-sm font-bold">Rasio Seller Aktif vs Suspend: {data.sellerRatio}% aktif</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v: string) => v.slice(5)} interval={4} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={28} />
                  <RechartsTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 12 }} />
                  <Area type="monotone" dataKey="tx" name="Transaksi" stroke="var(--chart-1)" strokeWidth={2.5} fill="var(--chart-1)" fillOpacity={0.12} />
                  <Line type="monotone" dataKey="ma7" name="MA 7" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Export CSV per tabel (SPEC-01-04) */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-bold">Export CSV (semua filter aktif diterapkan)</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { table: "transactions", label: "Transaksi" },
            { table: "commissions", label: "Komisi" },
            { table: "sellers", label: "Seller" },
          ].map((t) => (
            <a key={t.table} href={`/api/admin/csv?table=${t.table}`} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-all hover:border-primary/50 hover:bg-accent/50">
              <Download className="h-4 w-4" /> {t.label}.csv
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== SELLERS (Konteks Terkunci) ====================
function SellersTab() {
  const { toast } = useToast();
  const [rows, setRows] = useState<SellerRowDTO[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ sellers: SellerRowDTO[] }>("/api/admin/sellers");
      setRows(res.sellers);
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async: setState hanya setelah await
    load();
  }, [load]);

  const suspend = async (storeId: string, name: string) => {
    const reason = prompt(`Alasan terstruktur suspend toko ${name}:`);
    if (!reason) return;
    try {
      await api("/api/admin/sellers", { method: "POST", json: { storeId, action: "suspend", reason } });
      toast({ title: "Toko disuspend", description: "Seller menerima email alasan." });
      load();
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    }
  };

  const unsuspend = async (storeId: string) => {
    try {
      await api("/api/admin/sellers", { method: "POST", json: { storeId, action: "unsuspend" } });
      toast({ title: "Toko dipulihkan" });
      load();
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    }
  };

  if (!rows) return <div role="status" aria-label="Memuat daftar seller" aria-live="polite" aria-busy="true"><Skeleton className="h-96 rounded-3xl" /></div>;

  return (
    <div className="glass-card overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-3 font-semibold">Toko</th>
            <th className="px-3 py-3 font-semibold">Slug</th>
            <th className="px-3 py-3 font-semibold">Produk</th>
            <th className="px-3 py-3 font-semibold">Commission Owed</th>
            <th className="px-3 py-3 font-semibold">Status</th>
            <th className="px-3 py-3 font-semibold">Join</th>
            <th className="px-3 py-3 font-semibold">TX Verified</th>
            <th className="px-3 py-3 font-semibold">Rating</th>
            <th className="px-5 py-3 text-right font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.store.id} className="border-b border-border/40 hover:bg-accent/30">
              <td className="px-5 py-3">
                <p className="font-semibold">{r.store.name}</p>
                <p className="text-xs text-muted-foreground">{r.ownerEmail}</p>
              </td>
              <td className="px-3 py-3 font-mono text-xs">{r.store.slug}</td>
              <td className="px-3 py-3">{r.productCount}</td>
              <td className="px-3 py-3 font-semibold text-amber-500">{formatRupiah(r.commissionOwed)}</td>
              <td className="px-3 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    r.store.status === "live"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : r.store.status === "suspended"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : "bg-neutral-500/10 text-neutral-500"
                  }`}
                >
                  {storeStatusLabel(r.store.status)}
                </span>
              </td>
              <td className="px-3 py-3 text-xs text-muted-foreground">{formatDate(r.store.createdAt)}</td>
              <td className="px-3 py-3">{r.verifiedTx}</td>
              <td className="px-3 py-3">{r.ratingAvg ? r.ratingAvg.toFixed(1) : "-"}</td>
              <td className="px-5 py-3 text-right">
                {r.store.status === "suspended" ? (
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => unsuspend(r.store.id)}>
                    Pulihkan
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="rounded-lg text-destructive hover:bg-destructive/10" onClick={() => suspend(r.store.id, r.store.name)}>
                    Suspend
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==================== VERIFIKASI (Konteks Terkunci + SPEC-08) ====================
function VerificationsTab() {
  const { toast } = useToast();
  const [sub, setSub] = useState<"queue" | "history">("queue");
  const [filter, setFilter] = useState("pending");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<VerificationItemDTO[] | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEntryDTO[] | null>(null);
  const [inspectOpen, setInspectOpen] = useState<VerificationItemDTO | null>(null);
  const [deciding, setDeciding] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const sp = new URLSearchParams({ filter });
      if (q) sp.set("q", q);
      const res = await api<{ items: VerificationItemDTO[]; auditTrail: AuditEntryDTO[] }>(`/api/admin/verifications?${sp}`);
      setItems(res.items);
      setAuditTrail(res.auditTrail);
    } catch {
      setItems([]);
    }
  }, [filter, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const inspect = async (productId: string) => {
    try {
      const res = await api<{ autoRejected: boolean; reason?: string }>(`/api/admin/verifications/${productId}/inspect`, { method: "POST" });
      toast({ title: res.autoRejected ? "Reject otomatis dijalankan" : "Inspeksi dijalankan", description: res.reason ?? "Laporan diperbarui." });
      load();
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    }
  };

  const decide = async (productId: string, decision: "approve" | "reject") => {
    const reason = decision === "reject" ? prompt("Alasan reject (wajib, terstruktur):") ?? "" : undefined;
    if (decision === "reject" && !reason) return;
    setDeciding(productId);
    try {
      await api(`/api/admin/verifications/${productId}/decide`, { method: "POST", json: { decision, reason } });
      toast({ title: decision === "approve" ? "Produk disetujui & aktif" : "Produk ditolak" });
      load();
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setDeciding(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          <button
            onClick={() => setSub("queue")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${sub === "queue" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            aria-pressed={sub === "queue"}
          >
            Antrean Verifikasi
          </button>
          <button
            onClick={() => setSub("history")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${sub === "history" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            aria-pressed={sub === "history"}
          >
            Riwayat Verifikasi (Audit Trail)
          </button>
        </div>
        {sub === "queue" && (
          <div className="flex flex-wrap items-center gap-2">
            <Input className="h-10 w-52 rounded-xl" placeholder="Cari produk / toko…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari verifikasi" />
            <div className="flex gap-1">
              {[
                { id: "pending", label: "Menunggu" },
                { id: "rejected", label: "Ditolak" },
                { id: "active", label: "Aktif" },
                { id: "all", label: "Semua" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === f.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
                  aria-pressed={filter === f.id}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {sub === "queue" ? (
        !items ? (
          <div role="status" aria-label="Memuat antrean verifikasi" aria-live="polite" aria-busy="true"><Skeleton className="h-64 rounded-3xl" /></div>
        ) : items.length === 0 ? (
          <div className="glass-card p-10 text-center text-sm text-muted-foreground">Antrean kosong.</div>
        ) : (
          <div className="space-y-4">
            {items.map((it) => (
              <motion.div key={it.productId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        it.status === "pending_verification" ? "bg-primary/10 text-primary" : it.status === "rejected" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {it.status === "pending_verification" ? "Menunggu Verifikasi" : it.status === "rejected" ? "Ditolak" : "Aktif"}
                      </span>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{categoryLabel(it.category)}</span>
                    </div>
                    <p className="mt-1.5 font-semibold">{it.title}</p>
                    <p className="text-xs text-muted-foreground">Toko {it.storeName} (/toko/{it.storeSlug}) · {timeAgo(it.submittedAt ?? new Date().toISOString())}</p>
                    {it.rejectedReason && <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-600 dark:text-red-400">{it.rejectedReason}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {it.latestInspection && (
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setInspectOpen(it)}>
                        <FileSearch className="h-4 w-4" /> Laporan Inspeksi
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => inspect(it.productId)}>
                      <FlaskConical className="h-4 w-4" /> Inspeksi Ulang
                    </Button>
                    {it.status === "pending_verification" && (
                      <>
                        <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={() => decide(it.productId, "approve")} disabled={deciding === it.productId}>
                          {deciding === it.productId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={() => decide(it.productId, "reject")}>
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {/* Audit ringkas produk */}
                {it.audits.length > 0 && (
                  <div className="mt-4 border-t border-border/50 pt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Audit trail produk</p>
                    <ul className="mt-2 space-y-1.5">
                      {it.audits.slice(0, 4).map((a) => (
                        <li key={a.id} className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className={`rounded px-1.5 py-0.5 font-semibold ${
                            a.actorType === "system" ? "bg-neutral-500/10" : a.actorType === "ai" ? "bg-neutral-500/15 text-neutral-600 dark:text-neutral-300" : "bg-primary/10 text-primary"
                          }`}>
                            {a.actorType === "system" ? "SISTEM" : a.actorType === "ai" ? "AI" : "SUPER-ADMIN"}
                          </span>
                          <span className="font-medium text-foreground">{a.action}</span>
                          {a.decision && <span>→ {a.decision}</span>}
                          {a.reason && <span className="italic">"{a.reason}"</span>}
                          <span>· {timeAgo(a.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )
      ) : (
        /* Riwayat Verifikasi - audit trail global (SPEC-08-06) */
        <div className="glass-card overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-popover/95 backdrop-blur">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Waktu</th>
                  <th className="px-3 py-3 font-semibold">Aktor</th>
                  <th className="px-3 py-3 font-semibold">Aksi</th>
                  <th className="px-3 py-3 font-semibold">Produk</th>
                  <th className="px-5 py-3 font-semibold">Keputusan / Alasan</th>
                </tr>
              </thead>
              <tbody>
                {(auditTrail ?? []).map((a) => (
                  <tr key={a.id} className="border-t border-border/40">
                    <td className="px-5 py-2.5 text-xs text-muted-foreground">{formatDate(a.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                        a.actorType === "system" ? "bg-neutral-500/10" : a.actorType === "ai" ? "bg-neutral-500/15 text-neutral-600 dark:text-neutral-300" : "bg-primary/10 text-primary"
                      }`}>
                        {a.actorType === "system" ? "SISTEM" : a.actorType === "ai" ? "AI" : "SUPER-ADMIN"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium">{a.action}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{a.productTitle}</td>
                    <td className="px-5 py-2.5 text-xs">{a.decision ?? "-"} {a.reason ? `· "${a.reason}"` : ""}</td>
                  </tr>
                ))}
                {auditTrail && auditTrail.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Belum ada aktivitas audit.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
                <h2 className="text-lg font-bold">Laporan Inspeksi - {inspectOpen.title}</h2>
                <Button variant="ghost" size="icon" onClick={() => setInspectOpen(null)} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-muted/60 p-4 text-xs leading-relaxed">
                {inspectOpen.latestInspection?.markdown}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== DISPUTES (Konteks Terkunci, GAP-18) ====================
function DisputesTab() {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<DisputeDTO[] | null>(null);
  const [resolving, setResolving] = useState<DisputeDTO | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api<{ disputes: DisputeDTO[] }>("/api/admin/disputes");
      setDisputes(res.disputes);
    } catch {
      setDisputes([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async: setState hanya setelah await
    load();
  }, [load]);

  const setStatus = async (disputeId: string, status: string, resolutionNote?: string) => {
    try {
      await api("/api/admin/disputes", { method: "POST", json: { disputeId, status, note: resolutionNote } });
      toast({ title: "Status dispute diperbarui" });
      setResolving(null);
      setNote("");
      load();
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    }
  };

  if (!disputes) return <div role="status" aria-label="Memuat sengketa" aria-live="polite" aria-busy="true"><Skeleton className="h-64 rounded-3xl" /></div>;

  const groups = [
    { id: "open", label: "Open", tint: "bg-primary/10 text-primary" },
    { id: "investigating", label: "Investigating", tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { id: "resolved", label: "Resolved", tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const items = disputes.filter((d) => d.status === g.id);
        return (
          <section key={g.id} aria-labelledby={`dsp-${g.id}`}>
            <h2 id={`dsp-${g.id}`} className="flex items-center gap-2 text-sm font-bold">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${g.tint}`}>{g.label}</span>
              <span className="text-muted-foreground">({items.length})</span>
            </h2>
            <div className="mt-3 space-y-3">
              {items.map((d) => (
                <div key={d.id} className="glass-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{d.code}</span>
                        {d.order && <span className="font-mono text-xs text-muted-foreground">· {d.order.code}</span>}
                      </div>
                      <p className="mt-1 font-semibold">{d.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{d.body}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Dari {d.openedByEmail} · {timeAgo(d.createdAt)}
                        {d.order ? ` · ${d.order.productTitle} (${formatRupiah(d.order.price)})` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {d.status === "open" && (
                        <Button size="sm" className="rounded-xl" onClick={() => setStatus(d.id, "investigating")}>
                          Investigasi
                        </Button>
                      )}
                      {d.status !== "resolved" && (
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setResolving(d); setNote(""); }}>
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Kronologi */}
                  <div className="mt-3 border-t border-border/50 pt-3">
                    {d.events.map((e) => (
                      <p key={e.id} className="text-xs text-muted-foreground">
                        <b className="text-foreground">{e.actor}</b> · {e.note} · {timeAgo(e.createdAt)}
                      </p>
                    ))}
                    {d.resolutionNote && (
                      <p className="mt-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                        Resolusi: {d.resolutionNote}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada dispute {g.label.toLowerCase()}.</p>}
            </div>
          </section>
        );
      })}

      {/* Dialog resolve */}
      <AnimatePresence>
        {resolving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal
          >
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="glass-strong w-full max-w-md rounded-3xl p-6">
              <h2 className="text-lg font-bold">Resolve {resolving.code}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Refund manual dieksekusi di luar sistem - dicatat sebagai status Resolved + catatan teks (GAP-18).
              </p>
              <Textarea className="mt-4 min-h-24" placeholder="mis. Refund Rp59.000 dikirim manual via transfer pada 27 Okt - bukti diterima via email." value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="mt-4 flex gap-2">
                <Button className="flex-1 rounded-xl" disabled={note.length < 5} onClick={() => setStatus(resolving.id, "resolved", note)}>
                  Tandai Resolved
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setResolving(null)}>Batal</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== INVOICES (SPEC-09-06, GAP-16) ====================
function InvoicesTab() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceDTO[] | null>(null);
  const [verifying, setVerifying] = useState<InvoiceDTO | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ invoices: InvoiceDTO[] }>("/api/admin/invoices");
      setInvoices(res.invoices);
    } catch {
      setInvoices([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async: setState hanya setelah await
    load();
  }, [load]);

  const submitVerify = async (f: { paidAmount: string; paidAt: string; paidMethod: string; paidReference: string }) => {
    if (!verifying) return;
    try {
      const res = await api<{ ok: boolean; message: string }>("/api/admin/invoices", {
        method: "POST",
        json: {
          invoiceId: verifying.id,
          paidAmount: parseInt(f.paidAmount.replace(/\D/g, ""), 10) || 0,
          paidAt: f.paidAt || new Date().toISOString(),
          paidMethod: f.paidMethod,
          paidReference: f.paidReference || undefined,
        },
      });
      toast({ title: res.ok ? "Invoice lunas" : "Dicatat - belum lunas", description: res.message });
      setVerifying(null);
      load();
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    }
  };

  if (!invoices) return <div role="status" aria-label="Memuat invoice" aria-live="polite" aria-busy="true"><Skeleton className="h-64 rounded-3xl" /></div>;

  return (
    <div className="glass-card overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-3 font-semibold">Invoice</th>
            <th className="px-3 py-3 font-semibold">Toko</th>
            <th className="px-3 py-3 font-semibold">Nominal</th>
            <th className="px-3 py-3 font-semibold">Suspend Pada</th>
            <th className="px-3 py-3 font-semibold">Pembayaran</th>
            <th className="px-5 py-3 text-right font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-border/40 hover:bg-accent/30">
              <td className="px-5 py-3">
                <p className="font-mono text-xs">{inv.code}</p>
                <p className="text-[11px] text-muted-foreground">{inv.entryCount ?? 0} event komisi</p>
              </td>
              <td className="px-3 py-3">{inv.store?.name}</td>
              <td className="px-3 py-3 font-semibold">{formatRupiah(inv.amount)}</td>
              <td className="px-3 py-3 text-xs text-muted-foreground">{formatDate(inv.suspendAt)}</td>
              <td className="px-3 py-3 text-xs">
                {inv.status === "paid" ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Lunas {inv.paidAmount ? formatRupiah(inv.paidAmount) : ""} {inv.paidMethod === "ewallet" ? "(e-wallet)" : "(transfer)"}
                  </span>
                ) : inv.paidAmount ? (
                  <span className="text-amber-600 dark:text-amber-400">Kurang bayar: {formatRupiah(inv.paidAmount)}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-5 py-3 text-right">
                {inv.status === "outstanding" && (
                  <Button size="sm" className="rounded-xl" onClick={() => setVerifying(inv)}>
                    Verifikasi Pembayaran
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {invoices.length === 0 && (
            <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Belum ada invoice komisi.</td></tr>
          )}
        </tbody>
      </table>

      {/* Form verifikasi (SPEC-09-06) */}
      <AnimatePresence>
        {verifying && <VerifyInvoiceForm invoice={verifying} onClose={() => setVerifying(null)} onSubmit={submitVerify} />}
      </AnimatePresence>
    </div>
  );
}

function VerifyInvoiceForm({
  invoice,
  onClose,
  onSubmit,
}: {
  invoice: InvoiceDTO;
  onClose: () => void;
  onSubmit: (f: { paidAmount: string; paidAt: string; paidMethod: string; paidReference: string }) => void;
}) {
  const [paidAmount, setPaidAmount] = useState(String(invoice.amount));
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [paidMethod, setPaidMethod] = useState("transfer");
  const [paidReference, setPaidReference] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal
    >
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} className="glass-strong w-full max-w-md rounded-3xl p-6">
        <h2 className="text-lg font-bold">Verifikasi Pembayaran Komisi - {invoice.code}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Toko {invoice.store?.name} · Nominal invoice {formatRupiah(invoice.amount)} · Verifikasi manual TANPA AI.
        </p>
        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="iv-amount">Nominal diterima (Rp)</Label>
            <Input id="iv-amount" className="h-11 rounded-xl" inputMode="numeric" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value.replace(/\D/g, ""))} />
            <p className="text-[11px] text-muted-foreground">Kurang bayar → invoice tetap belum lunas. Lebih bayar → jadi saldo kredit seller.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="iv-date">Tanggal bayar</Label>
              <Input id="iv-date" type="date" className="h-11 rounded-xl" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iv-method">Metode</Label>
              <select id="iv-method" value={paidMethod} onChange={(e) => setPaidMethod(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background/60 px-3 text-sm">
                <option value="transfer">Transfer</option>
                <option value="ewallet">E-wallet</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="iv-ref">Referensi (opsional)</Label>
            <Input id="iv-ref" className="h-11 rounded-xl" placeholder="No. transaksi / catatan" value={paidReference} onChange={(e) => setPaidReference(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 rounded-xl" onClick={() => onSubmit({ paidAmount, paidAt, paidMethod, paidReference })}>
              Simpan Verifikasi
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={onClose}>Batal</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==================== SETTINGS (SPEC-01-05..07) ====================
function SettingsTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlatformSettingsDTO | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ settings: PlatformSettingsDTO }>("/api/admin/settings").then((r) => setSettings(r.settings));
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        json: {
          commissionAmount: settings.commissionAmount,
          invoiceThreshold: settings.invoiceThreshold,
          suspendThreshold: settings.suspendThreshold,
          waTemplate: settings.waTemplate,
        },
      });
      toast({ title: "Settings disimpan", description: "Nominal komisi hanya berlaku untuk transaksi baru (SPEC-01-05)." });
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const testPreview = async () => {
    if (!settings) return;
    try {
      const res = await api<{ preview: string }>("/api/admin/settings", { method: "POST", json: { waTemplate: settings.waTemplate } });
      setPreview(res.preview);
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    }
  };

  if (!settings) return <div role="status" aria-label="Memuat pengaturan Super-Admin" aria-live="polite" aria-busy="true"><Skeleton className="h-96 rounded-3xl" /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="glass-card p-5 md:p-6" aria-labelledby="adm-set-keu">
        <h2 id="adm-set-keu" className="text-sm font-bold">Keuangan</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="set-commission">Nominal komisi per transaksi (Rp)</Label>
            <Input
              id="set-commission"
              className="h-11 rounded-xl"
              inputMode="numeric"
              value={String(settings.commissionAmount)}
              onChange={(e) => setSettings({ ...settings, commissionAmount: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })}
            />
            <p className="text-[11px] text-muted-foreground">Snapshot tersimpan per order - Commission Owed lama tidak berubah sendiri.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-threshold">Threshold invoice komisi (Rp)</Label>
            <Input
              id="set-threshold"
              className="h-11 rounded-xl"
              inputMode="numeric"
              value={String(settings.invoiceThreshold)}
              onChange={(e) => setSettings({ ...settings, invoiceThreshold: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })}
            />
            <p className="text-[11px] text-muted-foreground">Default Rp25.000 (25 transaksi) - invoice terbit otomatis saat tercapai.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-suspend">Batas tunggakan sebelum suspend (Rp)</Label>
            <Input
              id="set-suspend"
              className="h-11 rounded-xl"
              inputMode="numeric"
              value={String(settings.suspendThreshold)}
              onChange={(e) => setSettings({ ...settings, suspendThreshold: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })}
            />
            <p className="text-[11px] text-muted-foreground">Peringatan email otomatis di 50% &amp; 80% batas.</p>
          </div>
          <Button className="rounded-2xl" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan Settings
          </Button>
        </div>
      </section>

      <section className="glass-card p-5 md:p-6" aria-labelledby="adm-set-wa">
        <h2 id="adm-set-wa" className="text-sm font-bold">Template WhatsApp Fallback (SPEC-01-07)</h2>
        <Textarea
          className="mt-4 min-h-40"
          value={settings.waTemplate}
          onChange={(e) => setSettings({ ...settings, waTemplate: e.target.value })}
          placeholder="Halo {nama_toko}, saya {nama_buyer}. Order {id_order}…"
        />
        <p className="mt-2 text-[11px] text-muted-foreground">
          Placeholder: {"{nama_buyer}"}, {"{nama_produk}"}, {"{jumlah}"}, {"{slug_toko}"}, {"{id_order}"}, {"{nama_toko}"} - pesan juga memuat ID order &amp; nama produk (SPEC-04-03).
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={testPreview}>
            Uji Pratinjau
          </Button>
        </div>
        {preview && (
          <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Pratinjau pesan</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{preview}</p>
          </div>
        )}
      </section>
    </div>
  );
}

// ==================== SISTEM (email log, MCP, laporan, maintenance) ====================
interface EmailRow { id: string; toEmail: string; subject: string; kind: string; status: string; createdAt: string }
interface McpRow { id: string; note: string | null; expiresAt: string; revokedAt: string | null; createdAt: string }
interface ReportRow { id: string; category: string; detail: string | null; status: string; productTitle: string; createdAt: string }

function SystemTab() {
  const { toast } = useToast();
  const [sub, setSub] = useState<"emails" | "mcp" | "reports">("emails");
  const [emails, setEmails] = useState<EmailRow[] | null>(null);
  const [tokens, setTokens] = useState<McpRow[] | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    try {
      if (sub === "emails") {
        const res = await api<{ emails: EmailRow[] }>("/api/admin/misc?what=emails");
        setEmails(res.emails);
      } else if (sub === "mcp") {
        const res = await api<{ tokens: McpRow[] }>("/api/admin/misc?what=mcp");
        setTokens(res.tokens);
      } else {
        const res = await api<{ reports: ReportRow[] }>("/api/admin/misc?what=reports");
        setReports(res.reports);
      }
    } catch {
      /* silent */
    }
  }, [sub]);

  useEffect(() => {
    load();
  }, [load]);

  const issueToken = async () => {
    const note = prompt("Catatan token (opsional):") ?? "";
    try {
      const res = await api<{ token: string }>("/api/admin/misc", { method: "POST", json: { action: "mcp-issue", note } });
      setNewToken(res.token);
      load();
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    }
  };

  const runMaintenance = async () => {
    setRunning(true);
    try {
      const res = await api<{ report: Record<string, number> }>("/api/admin/misc", { method: "POST", json: { action: "run-maintenance" } });
      toast({
        title: "Maintenance selesai",
        description: Object.entries(res.report).map(([k, v]) => `${k}: ${v}`).slice(0, 6).join(" · "),
      });
    } catch (err) {
      toast({ title: "Gagal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {[
            { id: "emails", label: "Email Log", icon: Mail },
            { id: "mcp", label: "MCP Token", icon: Bot },
            { id: "reports", label: "Laporan Abuse", icon: FileSearch },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSub(s.id as typeof sub)}
              aria-pressed={sub === s.id}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium ${sub === s.id ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              <s.icon className="h-4 w-4" /> {s.label}
            </button>
          ))}
        </div>
        <Button variant="outline" className="rounded-full" onClick={runMaintenance} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Jalankan Maintenance (Cron)
        </Button>
      </div>

      {sub === "emails" && (
        <div className="glass-card overflow-hidden">
          <div className="max-h-[520px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-popover/95 backdrop-blur">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Waktu</th>
                  <th className="px-3 py-3 font-semibold">Kepada</th>
                  <th className="px-3 py-3 font-semibold">Subjek</th>
                  <th className="px-3 py-3 font-semibold">Jenis</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {(emails ?? []).map((e) => (
                  <tr key={e.id} className="border-t border-border/40">
                    <td className="px-5 py-2.5 text-xs text-muted-foreground">{formatDate(e.createdAt, true)}</td>
                    <td className="px-3 py-2.5">{e.toEmail}</td>
                    <td className="px-3 py-2.5 font-medium">{e.subject}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{e.kind}</td>
                    <td className="px-5 py-2.5">
                      <span className={`text-xs font-semibold ${e.status === "sent" ? "text-emerald-500" : "text-muted-foreground"}`}>
                        {e.status === "sent" ? "terkirim" : "tercatat (sandbox)"}
                      </span>
                    </td>
                  </tr>
                ))}
                {emails && emails.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Belum ada email.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sub === "mcp" && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <KeyRound className="h-4 w-4" /> MCP Server (Streamable HTTP)
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Endpoint <code className="rounded bg-muted px-1.5 py-0.5 font-mono">/api/mcp</code> - secret token per-session,
                  expire 24 jam, tidak didaftarkan di direktori MCP publik (GAP-19). AI hanya mengusulkan keputusan.
                </p>
              </div>
              <Button className="rounded-xl" onClick={issueToken}>
                <Bot className="h-4 w-4" /> Issue Token (24 jam)
              </Button>
            </div>
            {newToken && (
              <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Token baru (tampil sekali)</p>
                <p className="mt-1.5 break-all font-mono text-sm">{newToken}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Pakai sebagai header: <code>Authorization: Bearer &lt;token&gt;</code> pada POST /api/mcp (JSON-RPC:
                  initialize → tools/list → tools/call).
                </p>
              </div>
            )}
          </div>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Dibuat</th>
                  <th className="px-3 py-3 font-semibold">Catatan</th>
                  <th className="px-3 py-3 font-semibold">Kedaluwarsa</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {(tokens ?? []).map((t) => (
                  <tr key={t.id} className="border-t border-border/40">
                    <td className="px-5 py-2.5 text-xs text-muted-foreground">{formatDate(t.createdAt, true)}</td>
                    <td className="px-3 py-2.5">{t.note ?? "-"}</td>
                    <td className="px-3 py-2.5 text-xs">{formatDate(t.expiresAt, true)}</td>
                    <td className="px-5 py-2.5">
                      {t.revokedAt ? (
                        <span className="text-xs font-semibold text-red-500">dicabut</span>
                      ) : new Date(t.expiresAt) < new Date() ? (
                        <span className="text-xs font-semibold text-muted-foreground">kedaluwarsa</span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-500">aktif</span>
                      )}
                    </td>
                  </tr>
                ))}
                {tokens && tokens.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">Belum ada token.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sub === "reports" && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Waktu</th>
                <th className="px-3 py-3 font-semibold">Produk</th>
                <th className="px-3 py-3 font-semibold">Kategori</th>
                <th className="px-5 py-3 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody>
              {(reports ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="px-5 py-2.5 text-xs text-muted-foreground">{formatDate(r.createdAt, true)}</td>
                  <td className="px-3 py-2.5 font-medium">{r.productTitle}</td>
                  <td className="px-3 py-2.5">{r.category}</td>
                  <td className="px-5 py-2.5 text-xs text-muted-foreground">{r.detail ?? "-"}</td>
                </tr>
              ))}
              {reports && reports.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">Belum ada laporan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
