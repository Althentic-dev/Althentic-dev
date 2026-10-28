"use client";

// =============================================================================
// Althentic.Dev - Prompt Generator (Task B3 - SPEC-12-01..06 + resolusi GAP-15)
// Canvas 7 blok gaya M3E: drag-and-reorder (dnd-kit) + tombol naik/turun
// (WCAG), preview langsung, ekspor Markdown/Plain Text/JSON, riwayat (login),
// mode template produk read-only dengan isi tersembunyi sampai pembelian.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { Check } from "@/components/animate-ui/icons/check";
import { Copy } from "@/components/animate-ui/icons/copy";
import { Eye } from "@/components/animate-ui/icons/eye";
import { FileDown } from "@/components/animate-ui/icons/file-down";
import { History } from "@/components/animate-ui/icons/history";
import { LayoutTemplate } from "@/components/animate-ui/icons/layout-template";
import { LoaderCircle as Loader2 } from "@/components/animate-ui/icons/loader-circle";
import { Lock } from "@/components/animate-ui/icons/lock";
import { Plus } from "@/components/animate-ui/icons/plus";
import { RotateCcw } from "@/components/animate-ui/icons/rotate-ccw";
import { ShoppingBag } from "@/components/animate-ui/icons/shopping-bag";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { SquarePen } from "@/components/animate-ui/icons/square-pen";
import { TriangleAlert } from "@/components/animate-ui/icons/triangle-alert";

import { api, ApiError } from "@/lib/api-client";
import { GENERATOR_BLOCKS, categoryLabel } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { useAppRouter } from "@/lib/router";
import { useAppStore } from "@/lib/store";
import type { GeneratorBlockData, ProductDetailDTO } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FadeIn,
  SortableBlockCard,
  blockMeta,
  resolveBlockType,
} from "./generator-block";
import type { CanvasBlock } from "./generator-block";
import { cn } from "@/lib/utils";

// --- Kontrak riwayat (GET /api/generator/export) ---
interface HistoryCanvas {
  id: string;
  title: string;
  blocks: GeneratorBlockData[];
  format: string;
  createdAt: string;
}

type ExportFormat = "markdown" | "text" | "json";

const EXPORT_FORMATS: { value: ExportFormat; label: string; ext: string }[] = [
  { value: "markdown", label: "Markdown (.md)", ext: "md" },
  { value: "text", label: "Plain Text (.txt)", ext: "txt" },
  { value: "json", label: "JSON (.json)", ext: "json" },
];

const DEFAULT_BLOCK_TYPES = ["role", "task", "context", "format"];

function makeBlocks(types: string[]): CanvasBlock[] {
  return types
    .filter((t) => GENERATOR_BLOCKS.some((g) => g.id === t))
    .map((t) => ({ uid: t, type: t, content: "" }));
}

/** Blok contoh mode template produk (SPEC-12-06) - 5 blok read-only. */
function templateBlocksFor(product: ProductDetailDTO): CanvasBlock[] {
  const cat = categoryLabel(product.category).toLowerCase();
  const desc = product.description.replace(/\s+/g, " ").trim();
  return [
    {
      uid: "role",
      type: "role",
      content: `Kamu adalah pakar ${cat} senior dengan 10+ tahun pengalaman membantu klien mengeksekusi ${product.title} secara praktis dan terukur.`,
    },
    {
      uid: "task",
      type: "task",
      content: `Susun rencana eksekusi lengkap untuk "${product.title}" dalam 14 hari pertama, lengkap dengan prioritas dan kriteria berhasil di tiap langkah.`,
    },
    {
      uid: "context",
      type: "context",
      content:
        desc.slice(0, 380) ||
        `Bisnis pengguna produk "${product.title}" berada di kategori ${cat}.`,
    },
    {
      uid: "format",
      type: "format",
      content:
        "Keluaran dalam Markdown bertahap: ringkasan eksekutif, tabel rencana, dan checklist tindakan dengan estimasi waktu.",
    },
    {
      uid: "constraints",
      type: "constraints",
      content:
        "Maksimal 800 kata, bahasa Indonesia yang lugas, hindari teori panjang - langsung ke langkah praktis yang bisa dijalankan hari ini.",
    },
  ];
}

function formatLabel(format: string): string {
  const found = EXPORT_FORMATS.find((f) => f.value === format);
  return found ? found.label.replace(/\s*\([^)]*\)/, "") : format;
}

function downloadPromptFile(content: string, ext: string) {
  const mime =
    ext === "json"
      ? "application/json"
      : ext === "md"
        ? "text/markdown"
        : "text/plain";
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prompt-althentic.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function GeneratorPage() {
  const { query, navigate } = useAppRouter();
  const user = useAppStore((s) => s.user);
  const userLoaded = useAppStore((s) => s.userLoaded);
  const openAuthDialog = useAppStore((s) => s.openAuthDialog);
  const { toast } = useToast();

  const templateSlug = query.template;

  // --- Kanvas ---
  const [blocks, setBlocks] = useState<CanvasBlock[]>(() =>
    makeBlocks(DEFAULT_BLOCK_TYPES)
  );
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [tab, setTab] = useState<"editor" | "pratinjau">("editor");
  const [pendingFocusUid, setPendingFocusUid] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  // --- Ekspor & salin ---
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [exportError, setExportError] = useState<
    { kind: "guest-limit" | "error"; message: string } | null
  >(null);
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Mode template produk (SPEC-12-06) ---
  const [tplProduct, setTplProduct] = useState<ProductDetailDTO | null>(null);
  const [tplLoading, setTplLoading] = useState(false);
  const [tplError, setTplError] = useState<string | null>(null);
  const templateAppliedRef = useRef(false);

  // --- Riwayat (login, GAP-15) ---
  const [history, setHistory] = useState<HistoryCanvas[] | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Muat produk saat query ?template=<slug> berubah
  useEffect(() => {
    let cancelled = false;
    if (!templateSlug) {
      if (templateAppliedRef.current) {
        templateAppliedRef.current = false;
        setBlocks(makeBlocks(DEFAULT_BLOCK_TYPES));
        setTitle("");
      }
      setTplProduct(null);
      setTplError(null);
      setTplLoading(false);
      return;
    }
    setTplLoading(true);
    setTplError(null);
    api<{ product: ProductDetailDTO }>(
      `/api/products/${encodeURIComponent(templateSlug)}`
    )
      .then((data) => {
        if (cancelled) return;
        setTplProduct(data.product);
        setBlocks(templateBlocksFor(data.product));
        setTitle("");
        templateAppliedRef.current = true;
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTplProduct(null);
        setTplError(
          err instanceof Error ? err.message : "Template tidak dapat dimuat."
        );
      })
      .finally(() => {
        if (!cancelled) setTplLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [templateSlug]);

  // Riwayat ekspor hanya untuk user login
  useEffect(() => {
    if (!user) {
      setHistory(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api<{ canvases: HistoryCanvas[] }>(
          "/api/generator/export"
        );
        if (!cancelled) setHistory(data.canvases ?? []);
      } catch {
        if (!cancelled) setHistory([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, historyVersion]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // --- Derived ---
  const templateActive = tplProduct !== null; // kanvas sedang memuat blok contoh
  const readOnly = templateActive;
  const templateLocked = templateActive && !tplProduct.owned;
  const activeTypes = useMemo(
    () => new Set(blocks.map((b) => b.type)),
    [blocks]
  );
  const filledBlocks = useMemo(
    () => blocks.filter((b) => b.content.trim() !== ""),
    [blocks]
  );
  const assembled = useMemo(
    () =>
      filledBlocks
        .map((b) => `[${blockMeta(b.type).label}]\n${b.content.trim()}`)
        .join("\n\n"),
    [filledBlocks]
  );

  // --- Aksi kanvas ---
  const handleContentChange = useCallback((uid: string, content: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.uid === uid ? { ...b, content } : b))
    );
  }, []);

  const addBlock = useCallback(
    (type: string) => {
      if (readOnly) return;
      setBlocks((prev) =>
        prev.some((b) => b.type === type)
          ? prev
          : [...prev, { uid: type, type, content: "" }]
      );
      setPendingFocusUid(type);
      setExportError(null);
    },
    [readOnly]
  );

  const moveBlock = useCallback(
    (uid: string, label: string, dir: -1 | 1) => {
      setBlocks((prev) => {
        const i = prev.findIndex((b) => b.uid === uid);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= prev.length) return prev;
        setAnnounce(
          `Blok ${label} dipindah ke posisi ${j + 1} dari ${prev.length}.`
        );
        return arrayMove(prev, i, j);
      });
    },
    []
  );

  const removeBlock = useCallback((uid: string) => {
    setBlocks((prev) =>
      prev.length <= 1 ? prev : prev.filter((b) => b.uid !== uid)
    );
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((b) => b.uid === active.id);
        const newIndex = prev.findIndex((b) => b.uid === over.id);
        if (oldIndex < 0 || newIndex < 0) return prev;
        setAnnounce(
          `Blok ${blockMeta(prev[oldIndex].type).label} dipindah ke posisi ${
            newIndex + 1
          } dari ${prev.length}.`
        );
        return arrayMove(prev, oldIndex, newIndex);
      });
    },
    []
  );

  const handleFocusHandled = useCallback(() => setPendingFocusUid(null), []);

  const loadCanvas = useCallback(
    (canvas: HistoryCanvas) => {
      if (readOnly) return;
      const seen = new Set<string>();
      const loaded: CanvasBlock[] = [];
      for (const b of canvas.blocks ?? []) {
        const type = resolveBlockType(b.type ?? "");
        if (!type || seen.has(type)) continue;
        seen.add(type);
        loaded.push({
          uid: type,
          type,
          content: (b.content ?? "").slice(0, 4000),
        });
      }
      if (loaded.length === 0) {
        setExportError({
          kind: "error",
          message: "Riwayat ini tidak memiliki blok yang valid untuk dimuat.",
        });
        return;
      }
      setBlocks(loaded);
      setTitle(canvas.title ?? "");
      if (
        canvas.format === "markdown" ||
        canvas.format === "text" ||
        canvas.format === "json"
      ) {
        setFormat(canvas.format);
      }
      setExportError(null);
      setExportStatus(
        `Kanvas "${canvas.title || "tanpa judul"}" dimuat dari riwayat - siap diedit atau diekspor ulang.`
      );
      setTab("editor");
    },
    [readOnly]
  );

  const doReset = useCallback(() => {
    setBlocks(makeBlocks(DEFAULT_BLOCK_TYPES));
    setTitle("");
    setFormat("markdown");
    setExportError(null);
    setExportStatus("Kanvas dikosongkan - siap mulai dari awal.");
    setAnnounce("Kanvas dimulai dari awal.");
  }, []);

  // --- Salin (navigator.clipboard, feedback 2 detik) ---
  const handleCopy = useCallback(async () => {
    if (!assembled || templateLocked) return;
    try {
      if (!navigator.clipboard) throw new Error("clipboard tidak tersedia");
      await navigator.clipboard.writeText(assembled);
      setCopied(true);
      setCopyStatus("Prompt tersalin ke papan klip.");
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyStatus(
        "Gagal menyalin otomatis - seleksi teks pratinjau lalu salin manual."
      );
    }
  }, [assembled, templateLocked]);

  // --- Ekspor (SPEC-12-05 + GAP-15) ---
  const handleExport = useCallback(async () => {
    if (exporting || templateLocked) return;
    const payload = filledBlocks.map((b) => ({
      id: b.uid,
      type: blockMeta(b.type).label, // type = label blok
      content: b.content.trim(),
    }));
    if (payload.length === 0) {
      setExportStatus("");
      setExportError({
        kind: "error",
        message: "Isi minimal satu blok sebelum mengekspor prompt.",
      });
      return;
    }
    setExporting(true);
    setExportError(null);
    setExportStatus("");
    try {
      const ext =
        EXPORT_FORMATS.find((f) => f.value === format)?.ext ?? "txt";
      const data = await api<{
        content: string;
        saved: boolean;
        remainingGuestExports: number | null;
      }>("/api/generator/export", {
        method: "POST",
        json: {
          format,
          title: title.trim() || undefined,
          blocks: payload,
        },
      });
      downloadPromptFile(data.content, ext);
      if (user) {
        toast({
          title: "Tersimpan ke riwayat",
          description:
            "Prompt otomatis tersimpan ke akun Althentic-mu dan bisa dimuat ulang kapan saja.",
        });
        setHistoryVersion((v) => v + 1);
        setExportStatus(
          `Prompt diekspor sebagai prompt-althentic.${ext} dan tersimpan ke riwayat akunmu.`
        );
      } else if (typeof data.remainingGuestExports === "number") {
        setExportStatus(
          `Prompt diekspor sebagai prompt-althentic.${ext} - sisa ${data.remainingGuestExports} ekspor gratis hari ini.`
        );
      } else {
        setExportStatus(`Prompt diekspor sebagai prompt-althentic.${ext}.`);
      }
    } catch (err: unknown) {
      if (
        err instanceof ApiError &&
        (err.code === "GUEST_LIMIT" || err.status === 402)
      ) {
        setExportError({ kind: "guest-limit", message: err.message });
      } else {
        setExportError({
          kind: "error",
          message:
            err instanceof Error ? err.message : "Ekspor gagal. Coba lagi.",
        });
      }
    } finally {
      setExporting(false);
    }
  }, [exporting, templateLocked, filledBlocks, format, title, user, toast]);

  const srAnnounce = useCallback((message: string) => setAnnounce(message), []);

  // ===========================================================================
  // Render
  // ===========================================================================
  return (
    <div className="container-page pb-20 pt-10 sm:pt-12">
      {/* Wilayah pengumuman screen reader (drag/move/reset) */}
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      {/* --- Judul & tagline (SPEC-12-01) --- */}
      <FadeIn>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/30 bg-primary/5 px-2.5 py-1 text-primary"
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              Gratis
            </Badge>
            <h1 className="text-balance mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Prompt <span className="text-gradient-brand">Generator</span>
            </h1>
            <p className="text-balance mt-2 text-muted-foreground">
              Rakit prompt terstruktur 7 blok, siap tempel ke AI favoritmu.
            </p>
            {userLoaded && !user && (
              <p className="mt-2 text-sm text-muted-foreground">
                Tanpa akun: ekspor gratis 3x/hari per perangkat.{" "}
                <button
                  type="button"
                  onClick={() => openAuthDialog("register")}
                  className="-my-1 rounded font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Buat akun gratis
                </button>{" "}
                untuk ekspor tanpa batas dan riwayat tersimpan.
              </p>
            )}
          </div>
          {!templateSlug && (
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Mulai Baru
            </Button>
          )}
        </header>
      </FadeIn>

      {/* --- Banner mode template produk (SPEC-12-06) --- */}
      {templateSlug && (
        <FadeIn delay={0.05}>
          <div
            role="note"
            className="glass-card mt-6 flex flex-wrap items-center gap-3 p-4 sm:p-5"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <LayoutTemplate className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">
                Template dari produk:{" "}
                {tplLoading ? (
                  <span className="animate-pulse-soft text-muted-foreground">
                    memuat…
                  </span>
                ) : tplProduct ? (
                  tplProduct.title
                ) : (
                  <span className="text-destructive">
                    {tplError ?? "tidak ditemukan"}
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {tplProduct
                  ? tplProduct.owned
                    ? "Kamu pemilik produk ini - seluruh isi contoh terbuka."
                    : "Kanvas menampilkan blok contoh mode baca-saja. Isi tersembunyi sampai pembelian selesai."
                  : "Mode template menampilkan blok contoh baca-saja dari produk."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="h-11"
                onClick={() =>
                  navigate({
                    v: "product",
                    id: templateSlug,
                    template: "",
                  })
                }
              >
                <ShoppingBag className="size-4" aria-hidden="true" />
                Beli produk ini
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-11"
                onClick={() => navigate({ template: "" })}
              >
                Keluar mode template
              </Button>
            </div>
          </div>
        </FadeIn>
      )}

      {/* --- Layout utama: editor + pratinjau (desktop grid / mobile Tabs) --- */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "editor" | "pratinjau")}
        className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]"
      >
        <TabsList className="grid h-13 w-full grid-cols-2 lg:hidden">
          <TabsTrigger value="editor" className="gap-1.5">
            <SquarePen className="size-4" aria-hidden="true" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="pratinjau" className="gap-1.5">
            <Eye className="size-4" aria-hidden="true" />
            Pratinjau
          </TabsTrigger>
        </TabsList>

        {/* ============================ KOLOM EDITOR ============================ */}
        <TabsContent value="editor" forceMount className="outline-none">
          <div className={cn(tab === "editor" ? "block" : "hidden", "lg:block")}>
            <div className="grid gap-6">
              {/* Panel tambah blok (SPEC-12-03) */}
              <FadeIn delay={0.05}>
                <section
                  aria-labelledby="tambah-blok-heading"
                  className="glass-card p-4 sm:p-5"
                >
                  <h2
                    id="tambah-blok-heading"
                    className="flex items-center gap-2 text-sm font-semibold"
                  >
                    <Plus className="size-4 text-primary" aria-hidden="true" />
                    Tambah Blok
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Klik untuk menambah blok ke kanvas. Urutan blok menentukan
                    urutan struktur prompt akhir.
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {GENERATOR_BLOCKS.map((b) => {
                      const exists = activeTypes.has(b.id);
                      const Icon = blockMeta(b.id).Icon;
                      return (
                        <li key={b.id}>
                          <button
                            type="button"
                            onClick={() => addBlock(b.id)}
                            disabled={exists || readOnly}
                            aria-label={`Tambah blok ${b.label}`}
                            className={cn(
                              "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all",
                              "hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45"
                            )}
                          >
                            <Icon className="size-4 shrink-0" aria-hidden="true" />
                            {b.label}
                            {exists && (
                              <>
                                <Check
                                  className="size-3.5 text-emerald-600 dark:text-emerald-400"
                                  aria-hidden="true"
                                />
                                <span className="sr-only">
                                  (sudah ada di kanvas)
                                </span>
                              </>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </FadeIn>

              {/* Canvas drag-and-reorder (SPEC-12-04) */}
              <FadeIn delay={0.1}>
                <section aria-labelledby="kanvas-heading">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 id="kanvas-heading" className="text-sm font-semibold">
                      Kanvas Prompt
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {blocks.length} blok aktif - atur urutan dengan menyeret
                      handle atau tombol naik/turun.
                    </p>
                  </div>
                  <p className="sr-only">
                    Daftar blok prompt. Gunakan tombol pindahkan ke atas atau ke
                    bawah pada setiap blok untuk mengubah urutan tanpa seret.
                  </p>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={blocks.map((b) => b.uid)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ul className="mt-3 grid gap-4">
                        <AnimatePresence initial={false}>
                          {blocks.map((b, i) => (
                            <SortableBlockCard
                              key={b.uid}
                              block={b}
                              index={i}
                              total={blocks.length}
                              readOnly={readOnly}
                              locked={templateLocked}
                              canRemove={blocks.length > 1}
                              focusRequested={pendingFocusUid === b.uid}
                              onContentChange={handleContentChange}
                              onRemove={removeBlock}
                              onMove={moveBlock}
                              onFocusHandled={handleFocusHandled}
                              onAnnounce={srAnnounce}
                            />
                          ))}
                        </AnimatePresence>
                      </ul>
                    </SortableContext>
                  </DndContext>
                </section>
              </FadeIn>

              {/* Riwayat ekspor - hanya user login (GAP-15) */}
              {user && (
                <FadeIn delay={0.15}>
                  <section
                    aria-labelledby="riwayat-heading"
                    className="glass-card p-4 sm:p-5"
                  >
                    <h2
                      id="riwayat-heading"
                      className="flex items-center gap-2 text-sm font-semibold"
                    >
                      <History className="size-4 text-primary" aria-hidden="true" />
                      Riwayat Prompt
                    </h2>
                    {history === null ? (
                      <p className="mt-3 animate-pulse-soft text-xs text-muted-foreground">
                        Memuat riwayat…
                      </p>
                    ) : history.length === 0 ? (
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        Belum ada prompt tersimpan. Setiap ekspor otomatis masuk
                        ke sini dan bisa dimuat ulang kapan saja.
                      </p>
                    ) : (
                      <ul className="mt-3 grid gap-2">
                        {history.map((c) => (
                          <li
                            key={c.id}
                            className="rounded-xl border border-border/60 bg-background/40 p-3 transition-colors hover:border-primary/40"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {c.title || "Prompt tanpa judul"}
                                </p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                  <span>{(c.blocks ?? []).length} blok</span>
                                  <span aria-hidden="true">•</span>
                                  <span>{formatLabel(c.format)}</span>
                                  <span aria-hidden="true">•</span>
                                  <span>{timeAgo(c.createdAt)}</span>
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-11 shrink-0"
                                disabled={readOnly}
                                title={
                                  readOnly
                                    ? "Tidak tersedia di mode template"
                                    : `Muat ${c.title || "prompt"} ke kanvas`
                                }
                                onClick={() => loadCanvas(c)}
                              >
                                <FileDown className="size-4" aria-hidden="true" />
                                Muat
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </FadeIn>
              )}
            </div>
          </div>
        </TabsContent>

        {/* =========================== KOLOM PRATINJAU ========================== */}
        <TabsContent value="pratinjau" forceMount className="outline-none">
          <div
            className={cn(
              tab === "pratinjau" ? "block" : "hidden",
              "lg:block lg:h-full"
            )}
          >
            <FadeIn delay={0.1}>
              <aside className="glass-card p-4 sm:p-5 lg:sticky lg:top-24">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Eye className="size-4 text-primary" aria-hidden="true" />
                    Pratinjau Prompt
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={handleCopy}
                    disabled={!assembled || templateLocked}
                    aria-label="Salin prompt ke papan klip"
                  >
                    {copied ? (
                      <Check
                        className="size-4 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <Copy className="size-4" aria-hidden="true" />
                    )}
                    <span aria-live="polite">
                      {copied ? "Tersalin" : "Salin"}
                    </span>
                  </Button>
                </div>

                <div className="relative mt-3 overflow-hidden rounded-xl border border-border/60">
                  <pre
                    className={cn(
                      "whitespace-pre-wrap break-words font-mono text-xs leading-relaxed sm:text-sm",
                      "max-h-[42vh] overflow-auto p-3.5 sm:p-4",
                      templateLocked && "blur-sm select-none"
                    )}
                  >
                    {assembled ||
                      "Belum ada isi. Tulis di blok editor - pratinjau prompt akan tersusun otomatis di sini."}
                  </pre>
                  {templateLocked && (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-background/30">
                      <p className="flex items-center gap-2 rounded-full bg-background/85 px-4 py-2 text-xs font-semibold text-foreground shadow-sm">
                        <Lock className="size-4 shrink-0" aria-hidden="true" />
                        Isi tersembunyi sampai pembelian selesai
                      </p>
                    </div>
                  )}
                </div>

                {/* --- Ekspor (SPEC-12-05) --- */}
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="prompt-title">Judul prompt (opsional)</Label>
                    <Input
                      id="prompt-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: Rencana konten 30 hari"
                      maxLength={120}
                      className="h-11"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="export-format">Format ekspor</Label>
                    <Select
                      value={format}
                      onValueChange={(v) => setFormat(v as ExportFormat)}
                      disabled={readOnly}
                    >
                      <SelectTrigger id="export-format" className="h-11 w-full">
                        <SelectValue placeholder="Pilih format" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPORT_FORMATS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {templateLocked && (
                    <p className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                      <Lock className="size-3.5 shrink-0" aria-hidden="true" />
                      Isi contoh terkunci - beli produknya untuk membuka, atau
                      keluar dari mode template untuk merakit prompt sendiri.
                    </p>
                  )}

                  <Button
                    className="h-11"
                    onClick={handleExport}
                    disabled={exporting || templateLocked}
                  >
                    {exporting ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <FileDown className="size-4" aria-hidden="true" />
                    )}
                    {exporting ? "Mengekspor…" : "Ekspor Prompt"}
                  </Button>

                  {/* Status ekspor (aria-live) */}
                  <p
                    role="status"
                    aria-live="polite"
                    className="min-h-4 text-xs leading-relaxed text-muted-foreground"
                  >
                    {exportStatus}
                  </p>
                  <p aria-live="polite" className="sr-only">
                    {copyStatus}
                  </p>

                  {/* Error umum */}
                  {exportError?.kind === "error" && (
                    <div
                      role="alert"
                      className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs leading-relaxed text-destructive"
                    >
                      <TriangleAlert
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{exportError.message}</span>
                    </div>
                  )}

                  {/* Ajakan login saat kuota guest habis (GAP-15) */}
                  {exportError?.kind === "guest-limit" && (
                    <div
                      role="alert"
                      className="rounded-xl border border-primary/30 bg-primary/5 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                          <Lock className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">
                            Kuota ekspor gratis hari ini habis
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {exportError.message} Buat akun gratis untuk ekspor
                            tanpa batas dan riwayat prompt yang otomatis
                            tersimpan.
                          </p>
                          <Button
                            size="sm"
                            className="mt-3 h-11"
                            onClick={() => openAuthDialog("register")}
                          >
                            Daftar Gratis
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </FadeIn>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- Konfirmasi reset kanvas --- */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mulai kanvas baru?</AlertDialogTitle>
            <AlertDialogDescription>
              Seluruh isi blok, judul, dan format akan dikembalikan ke kondisi
              awal. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={doReset}>
              Ya, Mulai Baru
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
