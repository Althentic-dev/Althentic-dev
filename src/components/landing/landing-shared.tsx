"use client";

// =============================================================================
// Althentic.Dev — Landing shared helpers (Task B1).
// Varian motion entrance (opacity + translateY, ease [0.22,1,0.36,1], stagger
// 0.08 — hormati useReducedMotion), SectionHeading semantik, pemetaan ikon
// kategori (string → komponen ikon Animate UI/lucide), dan baris bintang rating.
// =============================================================================

import type { ComponentType, ReactNode, SVGProps } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { FlaskConical } from "@/components/animate-ui/icons/flask-conical";
import { Globe } from "@/components/animate-ui/icons/globe";
import { GraduationCap } from "@/components/animate-ui/icons/graduation-cap";
import { Palette } from "@/components/animate-ui/icons/palette";
import { PenLine } from "@/components/animate-ui/icons/pen-line";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { Star } from "@/components/animate-ui/icons/star";
import { cn } from "@/lib/utils";

/**
 * Tipe ikon generik — komponen ikon Animate UI (lucide) dipakai di seluruh
 * platform; kontrak minimal yang dipakai seluruh pemanggilan ikon.
 */
export type IconComponent = ComponentType<{
  size?: number;
  className?: string;
  strokeWidth?: number | string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

/** Easing standar entrance landing (DESIGN: subtle, premium). */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Container stagger 0.08 antar item (aturan keras animasi landing). */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

/** Item entrance: opacity + translateY, subtle. */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

// -----------------------------------------------------------------------------
// Reveal — wrapper entrance saat elemen masuk viewport (sekali saja).
// -----------------------------------------------------------------------------
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// useStaggerProps — properti stagger untuk disebar ke motion.<tag> apa pun
// (mis. motion.dl) sehingga struktur HTML semantik tetap valid.
// -----------------------------------------------------------------------------
export function useStaggerProps() {
  const reduced = useReducedMotion();
  return {
    variants: staggerContainer,
    initial: reduced ? "show" : "hidden",
    whileInView: reduced ? undefined : "show",
    viewport: { once: true, margin: "-64px" },
  };
}

// -----------------------------------------------------------------------------
// StaggerGroup — container grid yang memicu fadeUpItem pada anak-anaknya.
// Anak harus berupa <motion.div variants={fadeUpItem}>.
// -----------------------------------------------------------------------------
export function StaggerGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const stagger = useStaggerProps();
  return (
    <motion.div className={className} {...stagger}>
      {children}
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// EyebrowPill — label kecil di atas judul section.
// -----------------------------------------------------------------------------
export function EyebrowPill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}

// -----------------------------------------------------------------------------
// SectionHeading — judul h2 + eyebrow + deskripsi (id dipakai aria-labelledby).
// -----------------------------------------------------------------------------
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  id: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow ? <EyebrowPill>{eyebrow}</EyebrowPill> : null}
      <h2
        id={id}
        className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

// -----------------------------------------------------------------------------
// IconTile — ubin ikon Lucide dengan gradasi brand (kontras aman kedua tema:
// light #17368f→#1d4ed8 + teks #f4f8ff ≈ 6.3:1; dark #4f8dff→#3b82f6 + teks
// #06102a ≈ 5.2:1 — memenuhi WCAG AA).
// -----------------------------------------------------------------------------
export function IconTile({
  icon: Icon,
  className,
}: {
  icon: IconComponent;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),var(--brand-blue))] text-primary-foreground shadow-lg shadow-primary/25 sm:size-14",
        className
      )}
    >
      <Icon className="size-6 sm:size-7" strokeWidth={2} />
    </span>
  );
}

// -----------------------------------------------------------------------------
// Pemetaan ikon kategori (field `icon` string di CATEGORIES → komponen lucide).
// -----------------------------------------------------------------------------
const CATEGORY_ICONS: Record<string, IconComponent> = {
  Globe,
  FlaskConical,
  GraduationCap,
  PenLine,
  Palette,
  Sparkles,
};

export function categoryIcon(icon: string): IconComponent {
  return CATEGORY_ICONS[icon] ?? Sparkles;
}

// -----------------------------------------------------------------------------
// StarRow — 5 bintang dengan isian fraksional (dekoratif; teks aksesibel
// disediakan lewat prop `label` / teks rating di sebelahnya).
// -----------------------------------------------------------------------------
export function StarRow({
  rating,
  label,
  className,
}: {
  rating: number;
  label?: string;
  className?: string;
}) {
  const pct = (Math.max(0, Math.min(5, rating)) / 5) * 100;
  const starBase = "size-4 shrink-0 text-muted-foreground/40";
  const starFill = "size-4 shrink-0 fill-foreground text-foreground";
  return (
    <span className={cn("relative inline-flex", className)}>
      {label ? <span className="sr-only">{label}</span> : null}
      <span aria-hidden="true" className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={starBase} strokeWidth={1.75} />
        ))}
      </span>
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 flex h-full gap-0.5 overflow-hidden"
        style={{ width: `${pct}%` }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={starFill} strokeWidth={1.75} />
        ))}
      </span>
    </span>
  );
}
