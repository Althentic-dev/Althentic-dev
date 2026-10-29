"use client";

// =============================================================================
// ProductView - detail produk (SPEC-03-06 urutan blok):
// preview besar (lightbox) → judul/toko/rating → tipe jual + harga → deskripsi
// → info file → review → produk serupa (GAP-14). + Beli (checkout SPEC-04-01),
// Coba di Generator (SPEC-12-06), Laporkan (SPEC-10-03), Review (SPEC-10-05).
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck } from "@/components/animate-ui/icons/badge-check";
import { ExternalLink } from "@/components/animate-ui/icons/external-link";
import { FileArchive } from "@/components/animate-ui/icons/file-archive";
import { Flag } from "@/components/animate-ui/icons/flag";
import { Hash } from "@/components/animate-ui/icons/hash";
import { LoaderCircle as Loader2 } from "@/components/animate-ui/icons/loader-circle";
import { MessageSquare } from "@/components/animate-ui/icons/message-square";
import { Package } from "@/components/animate-ui/icons/package";
import { Pencil } from "@/components/animate-ui/icons/pencil";
import { Send } from "@/components/animate-ui/icons/send";
import { ShoppingBag } from "@/components/animate-ui/icons/shopping-bag";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { Star } from "@/components/animate-ui/icons/star";
import { Store as StoreIcon } from "@/components/animate-ui/icons/store";
import { Zap } from "@/components/animate-ui/icons/zap";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppRouter } from "@/lib/router";
import { api, ApiError } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { SELL_TYPES, REPORT_CATEGORIES, sellTypeLabel, categoryLabel } from "@/lib/constants";
import { formatRupiah, formatRating, formatBytes, timeAgo } from "@/lib/format";
import type { ProductDetailDTO, ReviewDTO } from "@/lib/types";
import { ProductCard } from "@/components/catalog/catalog-view";

export function ProductView({ slug }: { slug?: string }) {
  const { navigate } = useAppRouter();
  const { user, openAuthDialog } = useAppStore();
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [buying, setBuying] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState<{ rating: number; text: string }>({ rating: 5, text: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ product: ProductDetailDTO }>(`/api/products/${slug}`);
      setProduct(res.product);
      setSelectedType(res.product.sellTypes[0]?.type ?? "");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load, user?.id]);

  const buy = async () => {
    if (!product) return;
    // Wajib akun sebelum checkout - registrasi tanpa kehilangan konteks (SPEC-04-01)
    if (!user) {
      openAuthDialog("register", "Buat akun dulu untuk melanjutkan checkout - konteks produkmu tetap di sini.");
      return;
    }
    if (!user.emailVerified) {
      toast({
        title: "Verifikasi email diperlukan",
        description: "Verifikasi email kamu dulu sebelum checkout pertama (cek Pengaturan Akun untuk kirim ulang).",
        variant: "destructive",
      });
      navigate({ v: "settings" }, { reset: true });
      return;
    }
    setBuying(true);
    try {
      const res = await api<{ orderId: string }>("/api/orders", {
        method: "POST",
        json: { productId: product.id, sellType: selectedType },
      });
      toast({ title: "Order dibuat", description: "Lanjutkan ke pembayaran." });
      navigate({ v: "checkout", id: res.orderId }, { reset: true });
    } catch (err) {
      const e = err as ApiError;
      if (e.code === "EMAIL_NOT_VERIFIED") {
        toast({ title: "Verifikasi email dulu", description: e.message, variant: "destructive" });
        navigate({ v: "settings" }, { reset: true });
      } else {
        toast({ title: "Gagal membuat order", description: e.message, variant: "destructive" });
      }
    } finally {
      setBuying(false);
    }
  };

  const submitReview = async () => {
    if (!product || reviewForm.text.length < 4) return;
    setSubmittingReview(true);
    try {
      await api(`/api/products/${product.slug}/reviews`, {
        method: "POST",
        json: { rating: reviewForm.rating, text: reviewForm.text },
      });
      toast({ title: "Review terkirim", description: "Terima kasih sudah mereview!" });
      setReviewForm({ rating: 5, text: "" });
      load();
    } catch (err) {
      toast({ title: "Gagal mengirim review", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
  };

  const report = async (category: string, detail: string) => {
    if (!product || !user) return;
    try {
      await api("/api/reports", {
        method: "POST",
        json: { productId: product.id, category, detail: detail || undefined },
      });
      toast({ title: "Laporan terkirim", description: "Tim moderasi akan meninjau produk ini." });
      setReportOpen(false);
    } catch (err) {
      toast({ title: "Gagal melaporkan", description: (err as Error).message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div role="status" aria-label="Memuat detail produk" aria-live="polite" aria-busy="true" className="container-page grid gap-8 py-10 lg:grid-cols-[1.15fr_1fr]">
        <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-bold">Produk tidak ditemukan</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-6 rounded-full" onClick={() => navigate({ v: "catalog" }, { reset: true })}>
          Kembali ke Katalog
        </Button>
      </div>
    );
  }

  const st = product.sellTypes.find((s) => s.type === selectedType) ?? product.sellTypes[0];
  const isPromptOnly = product.sellTypes.length === 1 && product.sellTypes[0].type === "prompt";

  return (
    <div className="container-page py-8 md:py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
        <button className="hover:text-foreground" onClick={() => navigate({ v: "catalog" }, { reset: true })}>
          Katalog
        </button>
        <span>/</span>
        <button
          className="hover:text-foreground"
          onClick={() => navigate({ v: "catalog", cat: product.category }, { reset: true })}
        >
          {categoryLabel(product.category)}
        </button>
        <span>/</span>
        <span className="truncate text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        {/* ==== Preview besar + lightbox (SPEC-03-06 blok 1) ==== */}
        <div>
          <button
            className="glass-card group relative block w-full overflow-hidden"
            onClick={() => setLightbox(0)}
            aria-label="Perbesar gambar preview"
          >
            {product.previews[0] ? (
              <img
                src={product.previews[0]}
                alt={`Preview utama ${product.title}`}
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="bg-brand-gradient flex aspect-[4/3] items-center justify-center">
                <Package className="h-14 w-14 text-white/60" />
              </div>
            )}
            <span className="absolute bottom-3 right-3 rounded-full bg-background/85 px-3 py-1.5 text-xs font-medium backdrop-blur">
              Klik untuk perbesar
            </span>
          </button>
          {product.previews.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.previews.slice(0, 5).map((p, i) => (
                <button
                  key={i}
                  className="glass-card overflow-hidden"
                  onClick={() => setLightbox(i)}
                  aria-label={`Preview ${i + 1}`}
                >
                  <img src={p} alt={`Preview ${i + 1} ${product.title}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ==== Info utama (blok 2-3) ==== */}
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-[28px]">{product.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                <button
                  className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                  onClick={() => navigate({ v: "store", id: product.store.slug }, { reset: true })}
                >
                  <StoreIcon className="h-4 w-4" /> {product.store.name}
                </button>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-foreground text-foreground" aria-hidden />
                  <span className="font-medium">{product.ratingAvg.toFixed(1)}</span>
                  <span className="text-muted-foreground">({product.ratingCount} review)</span>
                </span>
                <span className="text-muted-foreground">{product.salesCount} terjual</span>
              </div>
            </div>
            {user && !product.owned && (
              <ReportButton onReport={report} />
            )}
          </div>

          {/* Tipe jual + harga (GAP-14: hanya kategori Website punya >1 tipe) */}
          <div className="mt-6 space-y-2.5">
            {product.sellTypes.map((s) => (
              <button
                key={s.type}
                onClick={() => setSelectedType(s.type)}
                aria-pressed={selectedType === s.type}
                className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all duration-300 ${
                  selectedType === s.type
                    ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                    : "border-border bg-background/60 hover:border-primary/40"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      selectedType === s.type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.type === "template" ? <Package className="h-4.5 w-4.5" /> : s.type === "bundle" ? <BadgeCheck className="h-4.5 w-4.5" /> : <Sparkles className="h-4.5 w-4.5" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{sellTypeLabel(s.type)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {s.type === "template" && "File siap pakai + live demo"}
                      {s.type === "prompt" && "Prompt terstruktur siap tempel"}
                      {s.type === "bundle" && "Template + prompt pendamping"}
                    </span>
                  </span>
                </span>
                <span className="text-base font-bold text-primary">{formatRupiah(s.price)}</span>
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-6 space-y-3">
            {product.owned ? (
              <Button
                className="h-13 w-full rounded-2xl bg-emerald-600 text-base font-semibold hover:bg-emerald-700"
                onClick={() => navigate({ v: "collection" }, { reset: true })}
              >
                <ShoppingBag className="h-5 w-5" /> Kamu sudah punya - Buka Koleksi
              </Button>
            ) : (
              <Button className="h-13 w-full rounded-2xl text-base font-semibold" onClick={buy} disabled={buying}>
                {buying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                Beli Sekarang - {formatRupiah(st?.price ?? 0)}
              </Button>
            )}
            {isPromptOnly && (
              <Button
                variant="outline"
                className="h-11 w-full rounded-2xl"
                onClick={() => navigate({ v: "generator", template: product.slug }, { reset: true })}
              >
                <Sparkles className="h-4 w-4" /> Coba di Generator
              </Button>
            )}
            {product.liveDemoUrl && (
              <a
                href={product.liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" /> Lihat Live Demo
              </a>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Pembayaran QR bisnis seller · Verifikasi AI otomatis · Kuota unduh 1x
            </p>
          </div>

          {/* Info file (blok 6) */}
          <div className="glass-card mt-6 space-y-2.5 p-4 text-sm">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Info File</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileArchive className="h-4 w-4 shrink-0" /> File .zip via delivery aman (tanpa redirect Google Drive)
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4 shrink-0" /> Versi v{product.version}
              {product.versionNote ? ` - ${product.versionNote}` : ""}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4 shrink-0" /> {formatBytes(product.zipSize)} · {product.previews.length} gambar preview
            </div>
          </div>
        </div>
      </div>

      {/* ==== Deskripsi lengkap (blok 5) ==== */}
      <section className="mt-12 max-w-3xl" aria-labelledby="deskripsi">
        <h2 id="deskripsi" className="text-lg font-bold">Deskripsi</h2>
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-muted-foreground">
          {product.description}
        </p>
      </section>

      {/* ==== Review (blok 6) ==== */}
      <section className="mt-12" aria-labelledby="review">
        <h2 id="review" className="text-lg font-bold">
          Review <span className="text-sm font-normal text-muted-foreground">({product.ratingCount})</span>
        </h2>

        {/* Form review - hanya buyer order Lunas (SPEC-10-05) */}
        {product.canReview ? (
          <div className="glass-card mt-4 p-5">
            <p className="text-sm font-medium">Tulis review kamu</p>
            <div className="mt-3 flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  role="radio"
                  aria-checked={reviewForm.rating === r}
                  aria-label={`${r} bintang`}
                  onClick={() => setReviewForm((f) => ({ ...f, rating: r }))}
                  className="rounded-lg p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      r <= reviewForm.rating ? "fill-foreground text-foreground" : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              className="mt-3 min-h-24"
              placeholder="Bagaimana pengalamanmu memakai prompt ini?"
              value={reviewForm.text}
              onChange={(e) => setReviewForm((f) => ({ ...f, text: e.target.value }))}
              maxLength={1000}
            />
            <Button className="mt-3 rounded-full" onClick={submitReview} disabled={submittingReview || reviewForm.text.length < 4}>
              {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Kirim Review
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {product.owned
              ? "Kamu sudah mereview pembelian ini."
              : "Hanya buyer dengan order Lunas yang bisa menulis review."}
          </p>
        )}

        <div className="mt-5 space-y-4">
          {product.reviews.length === 0 && (
            <div className="glass-card p-6 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" aria-hidden />
              Belum ada review - jadi yang pertama setelah membeli.
            </div>
          )}
          {product.reviews.map((r, i) => (
            <ReviewCard key={r.id} review={r} index={i} onReplied={load} productSlug={product.slug} />
          ))}
        </div>
      </section>

      {/* ==== Produk serupa (blok 7 - kategori sama ±30% harga, GAP-14) ==== */}
      {product.similar.length > 0 && (
        <section className="mt-12" aria-labelledby="serupa">
          <h2 id="serupa" className="text-lg font-bold">Produk Serupa</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {product.similar.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ==== Lightbox ==== */}
      <Dialog open={lightbox !== null} onOpenChange={(v) => !v && setLightbox(null)}>
        <DialogContent className="max-w-4xl rounded-3xl p-2">
          <DialogTitle className="sr-only">Preview {product.title}</DialogTitle>
          {lightbox !== null && product.previews[lightbox] && (
            <img
              src={product.previews[lightbox]}
              alt={`Preview ${lightbox + 1} ${product.title}`}
              className="w-full rounded-2xl object-contain"
            />
          )}
          {product.previews.length > 1 && (
            <div className="mt-2 flex justify-center gap-2 p-2">
              {product.previews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i)}
                  aria-label={`Preview ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    lightbox === i ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewCard({ review, index, onReplied, productSlug }: { review: ReviewDTO; index: number; onReplied: () => void; productSlug: string }) {
  const { toast } = useToast();
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(review.text);

  const submitReply = async () => {
    setReplying(true);
    try {
      await api(`/api/reviews/${review.id}/reply`, { method: "POST", json: { reply } });
      toast({ title: "Balasan terkirim" });
      onReplied();
    } catch (err) {
      toast({ title: "Gagal membalas", description: (err as Error).message, variant: "destructive" });
    } finally {
      setReplying(false);
    }
  };

  const submitEdit = async () => {
    try {
      await api(`/api/products/${productSlug}/reviews`, { method: "PUT", json: { rating: review.rating, text: editVal } });
      toast({ title: "Review diperbarui" });
      setEditing(false);
      onReplied();
    } catch (err) {
      toast({ title: "Gagal mengedit", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-brand-gradient flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white">
            {review.userName.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold">{review.userName}</p>
            <p className="text-xs text-muted-foreground">
              {timeAgo(review.createdAt)}
              {review.editedAt ? " · diedit" : ""}
              {review.flagged ? " · sedang direview moderasi" : ""}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-0.5" aria-label={`Rating ${review.rating} dari 5`}>
          {[1, 2, 3, 4, 5].map((r) => (
            <Star
              key={r}
              className={`h-3.5 w-3.5 ${r <= review.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`}
            />
          ))}
        </span>
      </div>
      {editing ? (
        <div className="mt-3">
          <Textarea value={editVal} onChange={(e) => setEditVal(e.target.value)} className="min-h-20" maxLength={1000} />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={submitEdit}>Simpan</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Batal</Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-foreground/90">{review.text}</p>
      )}
      {review.canEdit && !editing && (
        <button
          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3 w-3" /> Edit (7 hari pertama)
        </button>
      )}
      {review.replyText && (
        <div className="mt-4 rounded-2xl border-l-2 border-primary bg-primary/5 p-4">
          <p className="text-xs font-semibold text-primary">Balasan seller</p>
          <p className="mt-1 text-sm text-foreground/90">{review.replyText}</p>
        </div>
      )}
      {review.canReply && !review.replyText && (
        <div className="mt-4 flex gap-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Balas review ini (satu kali, publik)…"
            className="min-h-16 text-sm"
            maxLength={600}
          />
          <Button size="sm" className="shrink-0 self-end rounded-xl" onClick={submitReply} disabled={replying || reply.length < 2}>
            {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </motion.article>
  );
}

function ReportButton({ onReport }: { onReport: (category: string, detail: string) => void }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(REPORT_CATEGORIES[0].id as string);
  const [detail, setDetail] = useState("");
  return (
    <>
      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setOpen(true)}>
        <Flag className="h-4 w-4" /> Laporkan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogTitle>Laporkan produk ini</DialogTitle>
          <div className="mt-4 space-y-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 rounded-xl" aria-label="Kategori laporan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Detail (opsional) - bantu moderasi memahami masalahnya"
              maxLength={600}
              className="min-h-20"
            />
            <Button className="w-full rounded-xl" onClick={() => onReport(category, detail)}>
              Kirim Laporan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
