"use client";

// =============================================================================
// Althentic.Dev - Prompt Generator (Task B3, SPEC-12-01..06)
// generator-block.tsx - kartu blok sortable (dnd-kit + Framer Motion layout),
// meta blok dari GENERATOR_BLOCKS, placeholder contoh, helper animasi FadeIn.
// =============================================================================

import { useEffect, useId, useRef, useState } from "react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, useReducedMotion } from "framer-motion";
import { AudioWaveform } from "@/components/animate-ui/icons/audio-waveform";
import { BookOpen } from "@/components/animate-ui/icons/book-open";
import { Check } from "@/components/animate-ui/icons/check";
import { ChevronDown } from "@/components/animate-ui/icons/chevron-down";
import { ChevronUp } from "@/components/animate-ui/icons/chevron-up";
import { FileText } from "@/components/animate-ui/icons/file-text";
import { GripVertical } from "@/components/animate-ui/icons/grip-vertical";
import { ListChecks } from "@/components/animate-ui/icons/list-checks";
import { Lock } from "@/components/animate-ui/icons/lock";
import { MessagesSquare } from "@/components/animate-ui/icons/messages-square";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";
import { UserRound } from "@/components/animate-ui/icons/user-round";


import { GENERATOR_BLOCKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
/** Tipe ikon generik (komponen ikon Animate UI/lucide - kontrak minimal). */
type IconComponent = ComponentType<{
  size?: number;
  className?: string;
  strokeWidth?: number | string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

// --- Model blok kanvas (uid unik; type = id blok dari GENERATOR_BLOCKS) ---
export interface CanvasBlock {
  uid: string;
  type: string;
  content: string;
}

// --- Ikon blok (icon name → komponen ikon Animate UI/lucide; revisi desain #2) ---
const BLOCK_ICON_MAP: Record<string, IconComponent> = {
  UserRound,
  ListChecks,
  BookOpen,
  FileText,
  ShieldCheck,
  MessagesSquare,
  AudioWaveform,
};

export function blockMeta(type: string): { label: string; Icon: IconComponent } {
  const found = GENERATOR_BLOCKS.find((b) => b.id === type);
  return {
    label: found?.label ?? type,
    Icon: BLOCK_ICON_MAP[found?.icon ?? ""] ?? FileText,
  };
}

/** Resolve tipe blok dari riwayat: riwayat menyimpan label ("Peran (Role)"), bukan id. */
export function resolveBlockType(raw: string): string | null {
  const byId = GENERATOR_BLOCKS.find((g) => g.id === raw);
  if (byId) return byId.id;
  const byLabel = GENERATOR_BLOCKS.find((g) => g.label === raw);
  if (byLabel) return byLabel.id;
  return null;
}

// --- Placeholder contoh per jenis blok (SPEC-12-03) ---
export const BLOCK_PLACEHOLDERS: Record<string, string> = {
  role: "Kamu adalah senior growth marketer dengan 10 tahun pengalaman…",
  task: "Buat rencana konten 30 hari untuk peluncuran produk baru…",
  context:
    "Produk: aplikasi kasir UMKM. Target: pemilik warung usia 25–40 tahun, aktif WhatsApp…",
  format: "Tabel Markdown 4 kolom + ringkasan eksekutif maks. 150 kata…",
  constraints:
    "Maksimal 500 kata. Bahasa Indonesia formal. Hindari jargon teknis…",
  examples:
    "Tempelkan contoh output yang kamu anggap bagus sebagai acuan di sini…",
  tone: "Profesional namun ramah, seperti mentor yang suportif…",
};

// --- Helper animasi entrance yang menghormati prefers-reduced-motion ---
export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.4,
        delay: reduce ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// SortableBlockCard - kartu glass vertikal dengan:
// - drag handle GripVertical (pointer only, aria-hidden - reorder keyboard
//   disediakan lewat tombol ChevronUp/ChevronDown agar WCAG-friendly)
// - label blok + ikon + counter karakter
// - Textarea editor dengan placeholder contoh
// - mode read-only (template produk) + isi tersembunyi (blur + Lock overlay)
// =============================================================================
export function SortableBlockCard({
  block,
  index,
  total,
  readOnly,
  locked,
  canRemove,
  focusRequested,
  onContentChange,
  onRemove,
  onMove,
  onFocusHandled,
  onAnnounce,
}: {
  block: CanvasBlock;
  index: number;
  total: number;
  readOnly: boolean;
  locked: boolean;
  canRemove: boolean;
  focusRequested: boolean;
  onContentChange: (uid: string, content: string) => void;
  onRemove: (uid: string, label: string) => void;
  onMove: (uid: string, label: string, dir: -1 | 1) => void;
  onFocusHandled: () => void;
  onAnnounce: (message: string) => void;
}) {
  const reduce = useReducedMotion();
  const { label, Icon } = blockMeta(block.type);
  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const {
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.uid, disabled: readOnly });

  // Fokus terkelola (WCAG): blok yang baru ditambah menerima fokus ke textareanya
  useEffect(() => {
    if (focusRequested && textareaRef.current) {
      textareaRef.current.focus();
      onFocusHandled();
    }
  }, [focusRequested, onFocusHandled]);

  const removeTitle = canRemove
    ? `Hapus blok ${label}`
    : "Minimal satu blok harus tersisa di kanvas";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("list-none", isDragging && "relative z-20")}
    >
      <motion.div
        layout={reduce ? false : true}
        initial={{ opacity: 0, y: reduce ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: reduce ? 1 : 0.98, transition: { duration: reduce ? 0 : 0.18 } }}
        transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <article
          aria-label={`Blok ${label}`}
          className={cn(
            "glass-card p-4 sm:p-5",
            isDragging && "ring-2 ring-primary/50 shadow-xl"
          )}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {!readOnly && (
              <div
                ref={setActivatorNodeRef}
                {...listeners}
                aria-hidden="true"
                title="Seret untuk mengurutkan blok"
                className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing"
              >
                <GripVertical className="size-4" aria-hidden="true" />
              </div>
            )}
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <label
                htmlFor={textareaId}
                className="block truncate text-sm font-semibold leading-tight"
              >
                {label}
                {readOnly && (
                  <span className="ml-2 text-[11px] font-medium text-muted-foreground">
                    (mode contoh)
                  </span>
                )}
              </label>
              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                {block.content.length} karakter
              </p>
            </div>
            {!readOnly && (
              <div className="ml-auto flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  disabled={index === 0}
                  aria-label={`Pindahkan blok ${label} ke atas`}
                  title={index === 0 ? "Blok pertama" : "Pindahkan ke atas"}
                  onClick={() => onMove(block.uid, label, -1)}
                >
                  <ChevronUp className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  disabled={index === total - 1}
                  aria-label={`Pindahkan blok ${label} ke bawah`}
                  title={index === total - 1 ? "Blok terakhir" : "Pindahkan ke bawah"}
                  onClick={() => onMove(block.uid, label, 1)}
                >
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={!canRemove}
                  aria-label={`Hapus blok ${label}`}
                  title={removeTitle}
                  onClick={() => setConfirmRemove(true)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>

          <div className="relative mt-3">
            <Textarea
              id={textareaId}
              ref={textareaRef}
              value={block.content}
              onChange={(e) => onContentChange(block.uid, e.target.value)}
              placeholder={BLOCK_PLACEHOLDERS[block.type] ?? "Tulis isi blok ini…"}
              maxLength={4000}
              disabled={readOnly}
              aria-describedby={locked ? `${textareaId}-lock` : undefined}
              className={cn(
                "min-h-28 text-sm leading-relaxed",
                locked && "blur-sm select-none"
              )}
            />
            {locked && (
              <div
                id={`${textareaId}-lock`}
                className="pointer-events-none absolute inset-0 grid place-items-center rounded-md bg-background/30"
              >
                <p className="flex items-center gap-2 rounded-full bg-background/85 px-4 py-2 text-xs font-semibold text-foreground shadow-sm">
                  <Lock className="size-4 shrink-0" aria-hidden="true" />
                  Isi tersembunyi sampai pembelian selesai
                </p>
              </div>
            )}
          </div>
        </article>
      </motion.div>

      {/* Konfirmasi ringan sebelum hapus blok */}
      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus blok {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Isi blok ini akan dihapus dari kanvas. Tindakan ini tidak bisa
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setConfirmRemove(false);
                onRemove(block.uid, label);
                onAnnounce(`Blok ${label} dihapus dari kanvas.`);
              }}
            >
              Hapus Blok
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
