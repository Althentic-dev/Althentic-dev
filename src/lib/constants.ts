// =============================================================================
// Althentic.Dev — Konstanta domain (GAP-14: kategori, tipe jual, chip harga,
// filter rating; GAP-23: 8 preset aksen — nilai "default diusulkan")
// =============================================================================

// --- Kategori produk (GAP-14) ---
export const CATEGORIES = [
  {
    id: "website",
    label: "Website",
    icon: "Globe",
    desc: "Template jadi, prompt arsitektur, dan bundle untuk membangun website cepat.",
  },
  {
    id: "research",
    label: "Riset",
    icon: "FlaskConical",
    desc: "Prompt riset pasar, analisis kompetitor, dan sintesis data.",
  },
  {
    id: "education",
    label: "Belajar / Edukasi",
    icon: "GraduationCap",
    desc: "Prompt belajar terstruktur, tutor personal, dan materi belajar.",
  },
  {
    id: "content",
    label: "Konten & Copywriting",
    icon: "PenLine",
    desc: "Prompt copywriting, konten media sosial, dan kampanye pemasaran.",
  },
  {
    id: "design",
    label: "Desain",
    icon: "Palette",
    desc: "Prompt UI/UX, ilustrasi, dan pembuatan aset visual.",
  },
  {
    id: "other",
    label: "Lain-lain",
    icon: "Sparkles",
    desc: "Prompt serbaguna di luar kategori lainnya.",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? "Lain-lain";
}

// --- Tipe jual (Konteks Terkunci + GAP-14: hanya kategori Website) ---
export const SELL_TYPES = [
  {
    id: "template",
    label: "Template Jadi",
    short: "Template",
    desc: "File siap pakai tinggal eksekusi — wajib live demo.",
    requiresDemo: true,
  },
  {
    id: "prompt",
    label: "Prompt saja",
    short: "Prompt",
    desc: "Prompt terstruktur siap tempel ke AI tool favoritmu.",
    requiresDemo: false,
  },
  {
    id: "bundle",
    label: "Bundle",
    short: "Bundle",
    desc: "Template jadi + prompt pendamping dalam satu paket.",
    requiresDemo: true,
  },
] as const;

export type SellTypeId = (typeof SELL_TYPES)[number]["id"];

export function sellTypeLabel(id: string): string {
  return SELL_TYPES.find((t) => t.id === id)?.label ?? "Prompt";
}

// --- Chip rentang harga (GAP-14) ---
export const PRICE_CHIPS = [
  { id: "under-25", label: "< Rp25rb", min: 0, max: 24999 },
  { id: "25-100", label: "Rp25rb – Rp100rb", min: 25000, max: 100000 },
  { id: "100-250", label: "Rp100rb – Rp250rb", min: 100000, max: 250000 },
  { id: "over-250", label: "> Rp250rb", min: 250001, max: Number.MAX_SAFE_INTEGER },
] as const;

// --- Filter rating (GAP-14) ---
export const RATING_FILTERS = [
  { id: "min4", label: "Rating 4+", min: 4 },
  { id: "min3", label: "Rating 3+", min: 3 },
  { id: "all", label: "Semua rating", min: 0 },
] as const;

// --- Sorting katalog (SPEC-03-03) ---
export const SORT_OPTIONS = [
  { id: "weekly", label: "Terlaris minggu ini" },
  { id: "newest", label: "Terbaru" },
  { id: "cheapest", label: "Termurah" },
  { id: "priciest", label: "Termahal" },
  { id: "rating", label: "Rating tertinggi" },
] as const;

// --- 8 preset aksen toko (SPEC-02-02; revisi desain #1: grayscale, tanpa warna) ---
export const ACCENT_PRESETS = [
  { id: 0, name: "Obsidian", hex: "#1f1f1f" },
  { id: 1, name: "Graphite", hex: "#2b2b2b" },
  { id: 2, name: "Charcoal", hex: "#373737" },
  { id: 3, name: "Slate", hex: "#434343" },
  { id: 4, name: "Steel", hex: "#4f4f4f" },
  { id: 5, name: "Tin", hex: "#5a5a5a" },
  { id: 6, name: "Ash", hex: "#616161" },
  { id: 7, name: "Smoke", hex: "#6b6b6b" },
] as const;

// --- Status order internal (GAP-01/11) ---
export const ORDER_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAYMENT_SUBMITTED: "payment_submitted",
  VERIFIED: "verified",
  COMPLETED: "completed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

export type OrderStatus = string;

// Label buyer-facing (SPEC-04-05 — 6 status + Booked)
export function orderStatusLabel(status: string, verifyPath?: string | null): string {
  switch (status) {
    case "pending_payment":
      return "Menunggu Pembayaran";
    case "payment_submitted":
      // GAP-01: "Booked" saat bukti diproses AI (jalur manual) atau menunggu verifikasi manual
      if (verifyPath === "manual" || verifyPath === "wa") return "Booked";
      return "Menunggu Verifikasi";
    case "verified":
      return "Lunas";
    case "completed":
      return "Selesai";
    case "rejected":
      return "Verifikasi Gagal";
    case "cancelled":
      return "Dibatalkan";
    case "expired":
      return "Kedaluwarsa";
    default:
      return status;
  }
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  payment_submitted: "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/30",
  verified: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  completed: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-600/30",
  rejected: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  cancelled: "bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30",
  expired: "bg-neutral-500/15 text-neutral-500 dark:text-neutral-500 border-neutral-500/30",
};

// --- Status produk ---
export const PRODUCT_STATUS = {
  DRAFT: "draft",
  PENDING_VERIFICATION: "pending_verification",
  REJECTED: "rejected",
  ACTIVE: "active",
  ARCHIVED: "archived",
  UNLISTED: "unlisted",
  SUSPENDED: "suspended",
} as const;

export function productStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "Draft",
    pending_verification: "Menunggu Verifikasi",
    rejected: "Ditolak",
    active: "Aktif",
    archived: "Diarsipkan",
    unlisted: "Di-unlist",
    suspended: "Disuspend",
  };
  return map[status] ?? status;
}

// --- Status toko (GAP-08) ---
export function storeStatusLabel(status: string): string {
  const map: Record<string, string> = {
    preparing: "Disiapkan",
    ready: "Siap",
    live: "Live",
    suspended: "Disuspend",
  };
  return map[status] ?? status;
}

// --- Kategori laporan abuse (SPEC-10-03) ---
export const REPORT_CATEGORIES = [
  { id: "illegal", label: "Konten ilegal" },
  { id: "plagiarism", label: "Plagiarisme" },
  { id: "mismatch", label: "Isi tidak sesuai deskripsi" },
  { id: "payment_fraud", label: "Penipuan pembayaran" },
  { id: "other", label: "Lainnya" },
] as const;

// --- Kategori dispute (GAP-18: batas waktu 7 hari setelah completed) ---
export const DISPUTE_CATEGORIES = [
  { id: "refund_inaccessible", label: "File tidak bisa diakses" },
  { id: "refund_mismatch", label: "Isi berbeda drastis dari deskripsi" },
  { id: "no_response", label: "Seller tidak merespons" },
  { id: "content_mismatch", label: "Isi prompt tidak sesuai janji" },
  { id: "takedown_appeal", label: "Banding takedown produk" },
  { id: "other", label: "Lainnya" },
] as const;

// --- Blok Prompt Generator (SPEC-12-03: 7 blok inti) ---
export const GENERATOR_BLOCKS = [
  { id: "role", label: "Peran (Role)", icon: "UserRound" },
  { id: "task", label: "Tugas (Task)", icon: "ListChecks" },
  { id: "context", label: "Konteks", icon: "BookOpen" },
  { id: "format", label: "Format Output", icon: "FileText" },
  { id: "constraints", label: "Batasan (Constraints)", icon: "ShieldCheck" },
  { id: "examples", label: "Contoh (Examples)", icon: "MessagesSquare" },
  { id: "tone", label: "Tone / Gaya", icon: "AudioWaveform" },
] as const;

// --- Batasan upload (SPEC-04-04, SPEC-06-02, SPEC-02-03, GAP-14) ---
export const UPLOAD_LIMITS = {
  receipt: { maxSizeMB: 5, formats: ["image/jpeg", "image/png", "image/heic"] },
  qr: { maxSizeMB: 2, formats: ["image/jpeg", "image/png"] },
  banner: { maxSizeMB: 2, formats: ["image/jpeg", "image/png"], width: 1600, height: 400 },
  preview: { maxSizeMB: 5, formats: ["image/jpeg", "image/png", "image/webp"], maxFiles: 5 },
} as const;

// --- Lain-lain ---
export const PAGE_SIZE = 24; // SPEC-03-05
export const ORDER_EXPIRY_HOURS = 24; // GAP-11: 24 jam dari checkout dimulai
export const DISPUTE_WINDOW_DAYS = 7; // GAP-18
export const GUEST_EXPORT_LIMIT = 3; // GAP-15: 3x export/hari/IP
export const RETENTION_RECEIPT_DAYS = 30; // GAP-04
export const RETENTION_METADATA_DAYS = 90; // GAP-04
export const REVIEW_EDIT_WINDOW_DAYS = 7; // SPEC-10-05
export const MANUAL_RESPONSE_HOURS = 24; // SPEC-02-07
export const GRACE_PERIOD_DAYS = 7; // GAP-03
