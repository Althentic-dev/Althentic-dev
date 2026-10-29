"use client";

// =============================================================================
// Althentic.Dev - DocsPage (Task B2)
// Halaman dokumentasi 12 section bergaya GitBook/Docusaurus:
// - Sidebar kiri sticky (desktop) / dropdown + search (mobile)
// - Section aktif via query param `tab` (default: getting-started)
// - Search client-side atas judul + isi konten
// - Section Changelog fetch live dari /api/webhooks/github-release
// - Framer Motion entrance per section (useReducedMotion dihormati)
// =============================================================================

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@/components/animate-ui/icons/arrow-right";
import { BookOpen } from "@/components/animate-ui/icons/book-open";
import { ChevronDown } from "@/components/animate-ui/icons/chevron-down";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import { CircleAlert } from "@/components/animate-ui/icons/circle-alert";
import { CircleCheck } from "@/components/animate-ui/icons/circle-check";
import { CircleHelp } from "@/components/animate-ui/icons/circle-help";
import { ExternalLink } from "@/components/animate-ui/icons/external-link";
import { GitBranch } from "@/components/animate-ui/icons/git-branch";
import { GraduationCap } from "@/components/animate-ui/icons/graduation-cap";
import { Info } from "@/components/animate-ui/icons/info";
import { KeyRound } from "@/components/animate-ui/icons/key-round";
import { Rocket } from "@/components/animate-ui/icons/rocket";
import { Scale } from "@/components/animate-ui/icons/scale";
import { Search } from "@/components/animate-ui/icons/search";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { ShoppingBag } from "@/components/animate-ui/icons/shopping-bag";
import { Store } from "@/components/animate-ui/icons/store";
import { Terminal } from "@/components/animate-ui/icons/terminal";
import { TriangleAlert } from "@/components/animate-ui/icons/triangle-alert";
import { Wrench } from "@/components/animate-ui/icons/wrench";


import { navigateTo, useAppRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { ChangelogDTO } from "@/lib/types";
import {
  DEFAULT_DOCS_TAB,
  DOCS_SECTIONS,
  sectionSearchText,
} from "./docs-content";
import type { CalloutTone, DocBlock, DocSection, TimelineTone } from "./docs-content";
/** Tipe ikon generik (komponen ikon Animate UI/lucide - kontrak minimal). */
type IconComponent = ComponentType<{
  size?: number;
  className?: string;
  strokeWidth?: number | string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

// ---------------------------------------------------------------- konstanta UI

const SECTION_ICONS: Record<string, IconComponent> = {
  rocket: Rocket,
  "shopping-bag": ShoppingBag,
  store: Store,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  "circle-help": CircleHelp,
  "git-branch": GitBranch,
  "key-round": KeyRound,
  wrench: Wrench,
  scale: Scale,
  "shield-check": ShieldCheck,
  terminal: Terminal,
};

const CALLOUT_CFG: Record<
  CalloutTone,
  { icon: IconComponent; chip: string; label: string }
> = {
  info: { icon: Info, chip: "bg-primary/10 text-primary", label: "Catatan" },
  warning: { icon: TriangleAlert, chip: "bg-amber-500/15 text-amber-600 dark:text-amber-400", label: "Perhatian" },
  danger: { icon: CircleAlert, chip: "bg-red-500/15 text-red-600 dark:text-red-400", label: "Penting" },
  success: { icon: CircleCheck, chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", label: "Tips" },
};

const TIMELINE_TONE: Record<TimelineTone, string> = {
  warn: "bg-amber-500",
  info: "bg-primary",
  ok: "bg-emerald-500",
  bad: "bg-red-500",
  muted: "bg-neutral-400 dark:bg-neutral-500",
};

const pad = (n: number) => String(n).padStart(2, "0");

const SEARCH_INDEX = DOCS_SECTIONS.map((s) => ({
  id: s.id,
  num: s.num,
  title: s.title,
  subtitle: s.subtitle,
  haystack: sectionSearchText(s),
}));

// ------------------------------------------------------------- markup inline

const INLINE_SPLIT = /(\*\*[^*]+\*\*|`[^`]+`)/g;

function renderInline(text: string): ReactNode[] {
  const parts = text.split(INLINE_SPLIT).filter(Boolean);
  return parts.map((part, i) => {
    if (part.length >= 5 && part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.length >= 3 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[0.85em] text-secondary-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

// ---------------------------------------------------------------- block views

function BlockView({ block }: { block: DocBlock }) {
  switch (block.kind) {
    case "p":
      return (
        <p className="text-[15px] leading-7 text-muted-foreground">
          {renderInline(block.text)}
        </p>
      );

    case "h2":
      return (
        <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground md:text-[22px]">
          {renderInline(block.text)}
        </h2>
      );

    case "list":
      return (
        <ul className="flex flex-col gap-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-7 text-muted-foreground">
              <span
                className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gradient"
                aria-hidden
              />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <ol className="flex flex-col gap-3">
          {block.items.map((item, i) => (
            <li key={i} className="glass-card flex gap-4 p-4 md:p-5">
              <span
                className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-brand-gradient font-mono text-sm font-bold text-white"
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{renderInline(item.title)}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {renderInline(item.text)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      );

    case "callout": {
      const cfg = CALLOUT_CFG[block.tone];
      const Icon = cfg.icon;
      return (
        <aside className="glass-card flex gap-4 p-4 md:p-5" role="note" aria-label={block.title}>
          <span
            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${cfg.chip}`}
            aria-hidden
          >
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{renderInline(block.title)}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {renderInline(block.text)}
            </p>
          </div>
        </aside>
      );
    }

    case "table":
      return (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/40">
                  {block.head.map((h, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/70 last:border-0">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 align-top leading-6 ${
                          j === 0 ? "font-medium text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "code":
      return (
        <figure className="glass-card overflow-hidden">
          {block.label && (
            <figcaption className="border-b border-border/70 bg-accent/30 px-4 py-2 font-mono text-xs font-semibold text-muted-foreground">
              {block.label}
            </figcaption>
          )}
          <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-foreground">
            {block.code}
          </pre>
        </figure>
      );

    case "kv":
      return (
        <dl className="glass-card divide-y divide-border/70">
          {block.items.map((item, i) => (
            <div key={i} className="grid gap-1 p-4 sm:grid-cols-[200px_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-foreground">{renderInline(item.term)}</dt>
              <dd className="text-sm leading-6 text-muted-foreground">{renderInline(item.def)}</dd>
            </div>
          ))}
        </dl>
      );

    case "timeline":
      return (
        <ol className="flex flex-col">
          {block.items.map((item, i) => (
            <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
              {i < block.items.length - 1 && (
                <span
                  className="stepper-line absolute bottom-0 left-[7px] top-6 w-0.5"
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full ring-4 ring-background ${TIMELINE_TONE[item.tone]}`}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{renderInline(item.label)}</p>
                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                  {renderInline(item.text)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      );

    case "links":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {block.items.map((item, i) => {
            const sp = new URLSearchParams(item.to);
            const href = `?${sp.toString()}`;
            return (
              <a
                key={i}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo(item.to, { reset: item.reset });
                }}
                className="glass-card-hover group flex items-center justify-between gap-3 p-4 outline-offset-2"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold group-hover:text-primary">
                    {renderInline(item.label)}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {renderInline(item.desc)}
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden
                />
              </a>
            );
          })}
        </div>
      );

    case "faq":
      return (
        <div className="flex flex-col gap-3">
          {block.items.map((item, i) => (
            <details key={i} className="glass-card group px-4 py-3 md:px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-semibold leading-6 text-foreground">
                  {renderInline(item.q)}
                </span>
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-3">
                {item.a.map((para, j) => (
                  <p key={j} className="text-sm leading-6 text-muted-foreground">
                    {renderInline(para)}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      );

    default:
      return null;
  }
}

// ------------------------------------------------------------- changelog feed

function ChangelogFeed() {
  const [entries, setEntries] = useState<ChangelogDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    api<{ entries: ChangelogDTO[] }>("/api/webhooks/github-release")
      .then((data) => {
        if (!cancelled) setEntries(data.entries ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat changelog.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <GitBranch className="size-3.5 shrink-0" aria-hidden />
        Tersinkron otomatis dari GitHub Releases via webhook.
      </p>

      {entries === null && !error && (
        <div className="flex flex-col gap-3" role="status" aria-live="polite">
          <span className="sr-only">Memuat changelog…</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-card flex flex-col gap-3 p-5" aria-hidden>
              <div className="h-4 w-24 motion-safe:animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-2/3 motion-safe:animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-full motion-safe:animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-5/6 motion-safe:animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="glass-card flex flex-col gap-3 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            Gagal memuat changelog
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => {
              setEntries(null);
              setError(null);
              setReloadKey((k) => k + 1);
            }}
            className="self-start rounded-full border border-border px-4 py-1.5 text-sm font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {entries && entries.length === 0 && (
        <div className="glass-card p-6 text-center">
          <p className="text-sm leading-6 text-muted-foreground">
            Belum ada rilis yang tersinkron. Entri akan muncul otomatis setiap kali ada GitHub
            Release baru.
          </p>
        </div>
      )}

      {entries &&
        entries.length > 0 &&
        entries.map((entry, i) => (
          <motion.article
            key={entry.id}
            className="glass-card p-5"
            initial={reduce ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.32,
              delay: Math.min(i * 0.06, 0.3),
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-semibold text-secondary-foreground">
                {entry.tagName}
              </span>
              <time className="text-xs font-medium text-muted-foreground" dateTime={entry.publishedAt}>
                {formatDate(entry.publishedAt)}
              </time>
            </div>
            <h2 className="mt-3 text-lg font-bold tracking-tight text-foreground">
              {entry.name}
            </h2>
            {entry.body && (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {entry.body}
              </p>
            )}
            {entry.url && (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Lihat di GitHub
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </motion.article>
        ))}
    </div>
  );
}

// -------------------------------------------------------------------- search

interface SearchHit {
  id: string;
  num: number;
  title: string;
  subtitle: string;
}

function DocsSearch({ onSelect }: { onSelect: (id: string) => void }) {
  const [q, setQ] = useState("");

  const results = useMemo<SearchHit[]>(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    return SEARCH_INDEX.map((s) => {
      const titleHit = s.title.toLowerCase().includes(needle);
      const bodyHit = s.haystack.includes(needle);
      if (!titleHit && !bodyHit) return null;
      const score = (titleHit ? 3 : 0) + (bodyHit ? 1 : 0);
      return { hit: { id: s.id, num: s.num, title: s.title, subtitle: s.subtitle }, score };
    })
      .filter((r): r is { hit: SearchHit; score: number } => r !== null)
      .sort((a, b) => b.score - a.score || a.hit.num - b.hit.num)
      .slice(0, 6)
      .map((r) => r.hit);
  }, [q]);

  const showPanel = q.trim().length >= 2;

  return (
    <div>
      <div className="relative">
        <label htmlFor="docs-search-input" className="sr-only">
          Cari di dokumentasi
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id="docs-search-input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results.length > 0) {
              onSelect(results[0].id);
              setQ("");
            }
          }}
          placeholder="Cari dokumentasi…"
          autoComplete="off"
          className="h-9 w-full rounded-lg border border-input bg-background/70 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring"
        />
      </div>

      {showPanel && (
        <div className="mt-2" aria-live="polite">
          {results.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-3 text-xs leading-5 text-muted-foreground">
              Tidak ada hasil untuk &ldquo;{q.trim()}&rdquo;. Coba kata kunci lain - misalnya
              &ldquo;refund&rdquo;, &ldquo;API key&rdquo;, atau &ldquo;verifikasi&rdquo;.
            </p>
          ) : (
            <ul className="overflow-hidden rounded-lg border border-border bg-card/60">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(r.id);
                      setQ("");
                    }}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-accent/60 focus-visible:bg-accent/60"
                  >
                    <span className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {pad(r.num)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {r.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {r.subtitle}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------- mobile section picker

function MobileSectionPicker({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = DOCS_SECTIONS.find((s) => s.id === activeId) ?? DOCS_SECTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="glass-card p-3">
      <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Dokumentasi - pilih bagian
      </p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="docs-mobile-nav"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-input bg-background/70 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent/50"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="font-mono text-xs text-muted-foreground">{pad(active.num)}</span>
          <span className="truncate">{active.title}</span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <nav id="docs-mobile-nav" aria-label="Navigasi dokumentasi" className="mt-2">
          <ul className="max-h-72 overflow-y-auto rounded-lg border border-border bg-card/80">
            {DOCS_SECTIONS.map((s) => {
              const isActive = s.id === activeId;
              return (
                <li key={s.id}>
                  <a
                    href={`?v=docs&tab=${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelect(s.id);
                      setOpen(false);
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-2.5 border-l-2 px-3 py-2.5 text-sm ${
                      isActive
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    <span className="w-5 shrink-0 font-mono text-[11px]">{pad(s.num)}</span>
                    <span className="flex-1">{s.title}</span>
                    {s.badge && (
                      <span className="rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                        {s.badge}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

// ------------------------------------------------------------- sidebar (desktop)

function SidebarNav({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return (
    <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:space-y-4 lg:overflow-y-auto lg:pb-2 lg:pr-1">
      <div className="glass-card p-3">
        <DocsSearch onSelect={onSelect} />
      </div>
      <nav aria-label="Navigasi dokumentasi" className="glass-card p-2">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          12 Bagian
        </p>
        <ul className="flex flex-col gap-0.5">
          {DOCS_SECTIONS.map((s) => {
            const isActive = s.id === activeId;
            return (
              <li key={s.id}>
                <a
                  href={`?v=docs&tab=${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelect(s.id);
                  }}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg border-l-2 py-2 pl-3 pr-2 text-sm ${
                    isActive
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <span
                    className={`w-5 shrink-0 font-mono text-[11px] ${
                      isActive ? "text-primary" : "text-muted-foreground/70"
                    }`}
                  >
                    {pad(s.num)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{s.title}</span>
                  {s.badge && (
                    <span className="rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                      {s.badge}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

// ------------------------------------------------------------------- prev/next

function PrevNextNav({
  prev,
  next,
  onSelect,
}: {
  prev: DocSection | null;
  next: DocSection | null;
  onSelect: (id: string) => void;
}) {
  return (
    <nav aria-label="Navigasi antar bagian" className="mt-12 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <a
          href={`?v=docs&tab=${prev.id}`}
          onClick={(e) => {
            e.preventDefault();
            onSelect(prev.id);
          }}
          className="glass-card-hover group flex items-center gap-3 p-4 outline-offset-2"
        >
          <ChevronLeft
            className="size-4 shrink-0 text-muted-foreground group-hover:text-primary"
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sebelumnya
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold group-hover:text-primary">
              {pad(prev.num)} · {prev.title}
            </span>
          </span>
        </a>
      ) : (
        <p className="glass-card hidden items-center p-4 text-xs text-muted-foreground sm:flex">
          Kamu berada di bagian pertama - selamat membaca.
        </p>
      )}

      {next ? (
        <a
          href={`?v=docs&tab=${next.id}`}
          onClick={(e) => {
            e.preventDefault();
            onSelect(next.id);
          }}
          className="glass-card-hover group flex items-center justify-end gap-3 p-4 text-right outline-offset-2"
        >
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Berikutnya
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold group-hover:text-primary">
              {pad(next.num)} · {next.title}
            </span>
          </span>
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground group-hover:text-primary"
            aria-hidden
          />
        </a>
      ) : (
        <p className="glass-card hidden items-center justify-end p-4 text-xs text-muted-foreground sm:flex">
          Kamu berada di bagian terakhir.
        </p>
      )}
    </nav>
  );
}

// ------------------------------------------------------------------- main page

export function DocsPage() {
  const { query, navigate } = useAppRouter();
  const reduce = useReducedMotion();

  const activeId = useMemo(() => {
    const tab = query.tab;
    return DOCS_SECTIONS.some((s) => s.id === tab) ? (tab as string) : DEFAULT_DOCS_TAB;
  }, [query.tab]);

  const active = DOCS_SECTIONS.find((s) => s.id === activeId) ?? DOCS_SECTIONS[0];
  const idx = DOCS_SECTIONS.findIndex((s) => s.id === activeId);
  const prev = idx > 0 ? DOCS_SECTIONS[idx - 1] : null;
  const next = idx < DOCS_SECTIONS.length - 1 ? DOCS_SECTIONS[idx + 1] : null;
  const Icon = SECTION_ICONS[active.icon] ?? BookOpen;

  // Section aktif diganti via query param tanpa reset penuh (pertahankan v).
  const goTo = useCallback(
    (id: string) => {
      navigate({ v: "docs", tab: id });
    },
    [navigate]
  );

  return (
    <div className="container-page pb-20 pt-8 lg:pt-12">
      <a
        href="#docs-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Lewati ke konten dokumentasi
      </a>

      {/* Mobile: pemilih bagian (dropdown custom) + pencarian */}
      <div className="mb-6 lg:hidden">
        <MobileSectionPicker activeId={activeId} onSelect={goTo} />
        <div className="glass-card mt-3 p-3">
          <DocsSearch onSelect={goTo} />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
        {/* Desktop: sidebar kiri sticky */}
        <aside className="hidden lg:block">
          <SidebarNav activeId={activeId} onSelect={goTo} />
        </aside>

        {/* Konten kanan */}
        <article id="docs-content" tabIndex={-1} className="max-w-3xl outline-none">
          <motion.div
            key={activeId}
            initial={reduce ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="mb-8">
              <div className="flex items-center gap-4">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm"
                  aria-hidden
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Bagian {pad(active.num)} dari 12
                  </p>
                  <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    {active.title}
                    {active.badge && (
                      <span className="ml-3 inline-flex translate-y-[-2px] items-center rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-red-600 dark:text-red-400">
                        {active.badge}
                      </span>
                    )}
                  </h1>
                </div>
              </div>
              <p className="mt-4 text-base leading-7 text-muted-foreground">{active.subtitle}</p>
            </header>

            <div className="flex flex-col gap-6">
              {active.blocks.map((block, i) => (
                <BlockView key={i} block={block} />
              ))}
              {active.special === "changelog" && <ChangelogFeed />}
            </div>

            <hr className="mt-10 border-border" />

            <PrevNextNav prev={prev} next={next} onSelect={goTo} />
          </motion.div>
        </article>
      </div>
    </div>
  );
}
