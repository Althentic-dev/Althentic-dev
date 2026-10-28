"use client";

// =============================================================================
// OnboardingView — 4 langkah (SPEC-06-01): (1) profil toko+slug permanen,
// (2) QR + pernyataan, (3) API key semi-optional / Lewati, (4) produk pertama
// opsional (GAP-08: toko "Siap" tanpa wajib produk — CTA ajakan).
// Draft tersimpan otomatis → checklist "Toko Anda X% siap" (SPEC-06-05).
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "@/components/animate-ui/icons/arrow-left";
import { ArrowRight } from "@/components/animate-ui/icons/arrow-right";
import { BadgeCheck } from "@/components/animate-ui/icons/badge-check";
import { Check } from "@/components/animate-ui/icons/check";
import { ImagePlus } from "@/components/animate-ui/icons/image-plus";
import { KeyRound } from "@/components/animate-ui/icons/key-round";
import { LoaderCircle as Loader2 } from "@/components/animate-ui/icons/loader-circle";
import { Package } from "@/components/animate-ui/icons/package";
import { PartyPopper } from "@/components/animate-ui/icons/party-popper";
import { QrCode } from "@/components/animate-ui/icons/qr-code";
import { Share2 } from "@/components/animate-ui/icons/share-2";
import { Store } from "@/components/animate-ui/icons/store";
import { Wallet } from "@/components/animate-ui/icons/wallet";
import { X } from "@/components/animate-ui/icons/x";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAppStore } from "@/lib/store";
import { slugify } from "@/lib/format";
import { navigateTo } from "@/lib/router";

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string;
  whatsapp?: string;
  qrUrl?: string | null;
  status: string;
  onboardingSteps: boolean[];
  aiProvider?: string;
  aiKeyPrimaryMask?: string | null;
}

const STEPS = [
  { id: 1, label: "Profil Toko", icon: Store },
  { id: 2, label: "QR Pembayaran", icon: QrCode },
  { id: 3, label: "API Key AI", icon: KeyRound },
  { id: 4, label: "Produk Pertama", icon: Package },
];

export function OnboardingView() {
  const { query, navigate } = useAppRouter();
  const { user, setUser } = useAppStore();
  const { toast } = useToast();
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(parseInt(query.step || "1", 10) || 1);
  const [completed, setCompleted] = useState(false);

  // Form step 1
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Form step 2
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrStatement, setQrStatement] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Form step 3
  const [aiProvider, setAiProvider] = useState("zai");
  const [aiKeyPrimary, setAiKeyPrimary] = useState("");
  const [aiKeyFallback, setAiKeyFallback] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api<{ store: StoreData | null }>("/api/seller/onboarding");
      setStore(res.store);
      if (res.store) {
        setName(res.store.name);
        setSlug(res.store.slug);
        setDescription(res.store.description);
        setQrPreview(res.store.qrUrl ?? null);
        setAiProvider(res.store.aiProvider || "zai");
        const steps = res.store.onboardingSteps ?? [];
        const done = steps.filter(Boolean).length;
        if (done >= 4) setCompleted(true);
        else if (steps[1]) setStep((s) => (s < 3 ? 3 : s));
        else if (steps[0]) setStep((s) => (s < 2 ? 2 : s));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!slugManuallyEdited && name) setSlug(slugify(name));
  }, [name]);

  const goStep = (s: number) => {
    setStep(s);
    navigateTo({ v: "onboarding", step: String(s) }, { replace: true });
  };

  const saveStep1 = async () => {
    setError(null);
    setSaving(true);
    try {
      await api("/api/seller/onboarding", {
        method: "POST",
        json: { step: 1, name, slug, description, whatsapp },
      });
      toast({ title: "Toko dibuat", description: `Slug ${slug} bersifat permanen.` });
      if (user) setUser({ ...user, hasStore: true, storeSlug: slug });
      await load();
      goStep(2);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const pickQr = (f: File | null) => {
    if (!f) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(f.type.toLowerCase())) {
      toast({ title: "Format QR harus JPG atau PNG.", variant: "destructive" });
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast({ title: "QR maksimal 2 MB.", variant: "destructive" });
      return;
    }
    setQrFile(f);
    const reader = new FileReader();
    reader.onload = () => setQrPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const saveStep2 = async () => {
    setError(null);
    setSaving(true);
    try {
      let qrBase64: string | undefined;
      if (qrFile) {
        const buf = await qrFile.arrayBuffer();
        qrBase64 = Buffer.from(buf).toString("base64");
      } else if (store?.qrUrl) {
        // QR sudah ada — hanya update pernyataan bila perlu
      } else {
        throw new Error("Unggah gambar QR bisnismu dulu.");
      }
      await api("/api/seller/onboarding", {
        method: "POST",
        json: { step: 2, qrBase64, qrVerified: qrStatement },
      });
      toast({ title: "QR pembayaran tersimpan" });
      await load();
      goStep(3);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveStep3 = async (skip: boolean) => {
    setError(null);
    setSaving(true);
    try {
      await api("/api/seller/onboarding", {
        method: "POST",
        json: {
          step: 3,
          skipKey: skip,
          aiProvider,
          aiKeyPrimary: skip ? undefined : aiKeyPrimary || undefined,
          aiKeyFallback: skip ? undefined : aiKeyFallback || undefined,
        },
      });
      toast({
        title: skip ? "API key dilewati" : "API key tersimpan & tervalidasi",
        description: skip ? "Semua order harus kamu approve manual." : "Verifikasi pembayaran berjalan otomatis.",
      });
      await load();
      goStep(4);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const finishStep4 = async () => {
    setSaving(true);
    try {
      await api("/api/seller/onboarding", { method: "POST", json: { step: 4 } });
      await load();
      setCompleted(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-page max-w-3xl py-12">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-8 h-96 rounded-3xl" />
      </div>
    );
  }

  // ===== Layar sukses (SPEC-06-06 + GAP-08) =====
  if (completed) {
    return (
      <div className="container-page max-w-2xl py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 text-center"
        >
          <span className="bg-brand-gradient mx-auto flex h-16 w-16 items-center justify-center rounded-3xl text-white shadow-xl">
            <PartyPopper className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">Toko Anda siap!</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Toko <b>{store?.name}</b> berstatus <b>Siap</b>. Toko tampil publik (Live) setelah produk pertama
            lolos verifikasi. Tiga langkah berikutnya:
          </p>
          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            <button
              onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/?v=store&id=${store?.slug}`)}
              className="glass-card-hover flex flex-col items-start gap-2 p-4"
            >
              <Share2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Bagikan link toko</span>
              <span className="text-xs text-muted-foreground">Salin /toko/{store?.slug}</span>
            </button>
            <button
              onClick={() => navigateTo({ v: "dashboard", tab: "products" }, { reset: true })}
              className="glass-card-hover flex flex-col items-start gap-2 p-4"
            >
              <Package className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Kirim produk pertama</span>
              <span className="text-xs text-muted-foreground">Opsional — untuk tayang publik</span>
            </button>
            <button
              onClick={() => navigateTo({ v: "dashboard", tab: "commissions" }, { reset: true })}
              className="glass-card-hover flex flex-col items-start gap-2 p-4"
            >
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Kenali Komisi & Tagihan</span>
              <span className="text-xs text-muted-foreground">Rp1.000/transaksi terverifikasi</span>
            </button>
          </div>
          <Button className="mt-8 rounded-full" onClick={() => navigateTo({ v: "dashboard" }, { reset: true })}>
            Buka Dashboard Seller <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // Checklist kesiapan (SPEC-06-05)
  const steps = store?.onboardingSteps ?? [false, false, false, false];
  const readiness = Math.round((steps.filter(Boolean).length / 4) * 100);

  return (
    <div className="container-page max-w-3xl py-8 md:py-12">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Buka Toko</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tanpa approval manusia — kontrol kualitas dilakukan saat verifikasi produk. Semua akun otomatis bisa jadi seller.
      </p>

      {/* Progress + checklist kesiapan */}
      <div className="glass-card mt-6 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Toko Anda {readiness}% siap</span>
          <span className="text-muted-foreground">Langkah {Math.min(step, 4)} dari 4</span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="bg-brand-gradient h-full rounded-full"
            animate={{ width: `${Math.max(readiness, step * 25 - 25)}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => steps[i] || step >= s.id ? goStep(s.id) : undefined}
              disabled={!steps[i] && step < s.id}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                steps[i]
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : step === s.id
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground/70"
              }`}
            >
              {steps[i] ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Langkah ===== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card mt-6 p-6 md:p-8"
        >
          {/* ---------- Step 1: Profil toko ---------- */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Store className="h-5 w-5 text-primary" /> Profil Toko
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nama, slug, deskripsi, dan nomor WhatsApp untuk fallback verifikasi.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ob-name">Nama toko</Label>
                  <Input id="ob-name" className="h-11 rounded-xl" placeholder="mis. Althentic Studio" value={name} onChange={(e) => setName(e.target.value)} disabled={!!store} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-slug">Slug permanen</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">/toko/</span>
                    <Input
                      id="ob-slug"
                      className="h-11 rounded-xl font-mono text-sm"
                      value={slug}
                      onChange={(e) => {
                        setSlug(slugify(e.target.value));
                        setSlugManuallyEdited(true);
                      }}
                      disabled={!!store}
                      placeholder="toko-anda"
                    />
                  </div>
                  {store ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Slug bersifat permanen dan tidak bisa diubah (SPEC-02-01).
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">3-30 karakter, huruf kecil + angka + tanda hubung.</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-desc">Deskripsi toko (maks 500 karakter)</Label>
                <Textarea
                  id="ob-desc"
                  className="min-h-24"
                  placeholder="Ceritakan keunggulan prompt yang kamu jual…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  maxLength={500}
                />
                <p className="text-right text-xs text-muted-foreground">{description.length}/500</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-wa">Nomor WhatsApp (wajib)</Label>
                <Input
                  id="ob-wa"
                  className="h-11 rounded-xl"
                  placeholder="08123456789"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  inputMode="tel"
                />
                <p className="text-xs text-muted-foreground">
                  Dipakai buyer saat verifikasi AI gagal — divalidasi format Indonesia.
                </p>
              </div>
              {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
              <Button className="w-full rounded-2xl" onClick={saveStep1} disabled={saving || !name || !slug || !whatsapp}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan &amp; Lanjut <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ---------- Step 2: QR ---------- */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <QrCode className="h-5 w-5 text-primary" /> QR Pembayaran
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  QRIS / QR bisnis milikmu sendiri — Althentic tidak memegang uang buyer. JPG/PNG maks 2 MB.
                </p>
              </div>
              <input
                ref={qrInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                onChange={(e) => pickQr(e.target.files?.[0] ?? null)}
                aria-label="Pilih file QR"
              />
              {!qrPreview ? (
                <button
                  onClick={() => qrInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border p-10 transition-all hover:border-primary/50 hover:bg-accent/40"
                >
                  <ImagePlus className="h-10 w-10 text-muted-foreground" />
                  <span className="text-sm font-medium">Unggah QR bisnismu</span>
                  <span className="text-xs text-muted-foreground">Preview besar akan tampil di sini</span>
                </button>
              ) : (
                <div className="glass relative mx-auto max-w-xs rounded-3xl p-4">
                  <img src={qrPreview} alt="Preview QR pembayaran" className="w-full rounded-2xl" />
                  <button
                    className="absolute -right-2 -top-2 rounded-full bg-background p-2 shadow-lg"
                    onClick={() => {
                      setQrFile(null);
                      setQrPreview(store?.qrUrl ?? null);
                    }}
                    aria-label="Ganti QR"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {/* Checkbox pernyataan (SPEC-06-02) */}
              <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-muted/40 p-4">
                <Checkbox id="ob-qr-state" checked={qrStatement} onCheckedChange={(v) => setQrStatement(v === true)} className="mt-0.5" />
                <Label htmlFor="ob-qr-state" className="text-sm font-normal leading-relaxed">
                  Saya sudah menguji scan QR ini dan nominalnya masuk ke rekening saya.
                </Label>
              </div>
              {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={() => goStep(1)}>
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </Button>
                <Button className="flex-1 rounded-2xl" onClick={saveStep2} disabled={saving || !qrStatement || (!qrFile && !store?.qrUrl)}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan &amp; Lanjut <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ---------- Step 3: API key semi-optional ---------- */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <KeyRound className="h-5 w-5 text-primary" /> API Key AI (Semi-Optional)
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Dipakai AI Receipt Scanner untuk verifikasi bukti transfer buyer secara otomatis.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Provider</Label>
                <Select value={aiProvider} onValueChange={setAiProvider}>
                  <SelectTrigger className="h-11 rounded-xl" aria-label="Pilih provider AI">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zai">Z.AI Vision (platform — tanpa key)</SelectItem>
                    <SelectItem value="gemini">Gemini — Google AI Studio (BYOK)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {aiProvider === "gemini" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-key1">API key primer</Label>
                    <Input id="ob-key1" type="password" className="h-11 rounded-xl font-mono text-sm" placeholder="AIza…" value={aiKeyPrimary} onChange={(e) => setAiKeyPrimary(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-key2">API key fallback (opsional)</Label>
                    <Input id="ob-key2" type="password" className="h-11 rounded-xl font-mono text-sm" placeholder="AIza…" value={aiKeyFallback} onChange={(e) => setAiKeyFallback(e.target.value)} />
                  </div>
                  <p className="rounded-xl bg-primary/10 px-3.5 py-2.5 text-xs leading-relaxed text-primary">
                    Key divalidasi dengan satu panggilan test murah, dienkripsi at-rest (AES-256-GCM), dan hanya
                    pernah tampil ter-mask (mis. AIza…9f2c). Timeout 15 detik, retry 1x, lalu fallback ke key kedua.
                  </p>
                </div>
              )}
              {aiProvider === "zai" && (
                <p className="rounded-xl bg-primary/10 px-3.5 py-2.5 text-xs leading-relaxed text-primary">
                  Provider platform: verifikasi berjalan otomatis tanpa perlu key sendiri. Pilihan ini aktif di
                  lingkungan sandbox; production dapat memakai Gemini BYOK.
                </p>
              )}

              {store?.aiKeyPrimaryMask && (
                <p className="text-xs text-muted-foreground">Key tersimpan saat ini: <span className="font-mono">{store.aiKeyPrimaryMask}</span></p>
              )}

              {/* Konsekuensi Lewati — eksplisit di layar (SPEC-06-03) */}
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  Lewati setup API key?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Konsekuensi: <b>semua order harus Anda approve manual</b> dengan 3 checklist wajib. Key bisa
                  diisi belakangan kapan saja dari Settings Toko.
                </p>
              </div>

              {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="rounded-2xl" onClick={() => goStep(2)}>
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </Button>
                <Button
                  className="flex-1 rounded-2xl"
                  onClick={() => saveStep3(false)}
                  disabled={saving || (aiProvider === "gemini" && !aiKeyPrimary)}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan Key &amp; Lanjut <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" className="rounded-2xl text-muted-foreground" onClick={() => saveStep3(true)} disabled={saving}>
                  Lewati dulu
                </Button>
              </div>
            </div>
          )}

          {/* ---------- Step 4: Produk pertama (opsional — GAP-08) ---------- */}
          {step === 4 && (
            <div className="space-y-5 text-center">
              <span className="bg-brand-gradient mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white">
                <BadgeCheck className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-lg font-bold">Toko kamu sudah Siap!</h2>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
                  Produk pertama <b>opsional</b> — kamu bisa menambahkannya nanti dari Dashboard Seller. Toko
                  tampil publik (Live) setelah minimal satu produk lolos verifikasi.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => goStep(3)}>
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </Button>
                <Button className="flex-1 rounded-2xl" onClick={() => navigateTo({ v: "dashboard", tab: "products" }, { reset: true })}>
                  <Package className="h-4 w-4" /> Tambah Produk Sekarang
                </Button>
              </div>
              <Button variant="ghost" className="rounded-full text-muted-foreground" onClick={finishStep4} disabled={saving}>
                Selesaikan onboarding <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
