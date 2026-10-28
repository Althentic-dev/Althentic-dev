// =============================================================================
// Althentic.Dev - Tipe DTO bersama (kontrak API client ↔ server, GAP-20)
// =============================================================================

export interface SellTypeOption {
  type: "template" | "prompt" | "bundle";
  price: number;
  driveFileId?: string;
  fileName?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "seller";
  isSuperAdmin: boolean;
  emailVerified: boolean;
  hasStore: boolean;
  storeSlug?: string;
  storeStatus?: string;
  themePref?: string;
}

export interface ProductCardDTO {
  id: string;
  slug: string;
  title: string;
  category: string;
  minPrice: number;
  sellTypes: string[];
  preview: string | null;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
  storeName: string;
  storeSlug: string;
  createdAt: string;
}

export interface ReviewDTO {
  id: string;
  rating: number;
  text: string;
  userName: string;
  createdAt: string;
  editedAt?: string | null;
  replyText?: string | null;
  repliedAt?: string | null;
  flagged?: boolean;
  canEdit?: boolean;
  canReply?: boolean;
}

export interface ProductDetailDTO {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  sellTypes: SellTypeOption[];
  previews: string[];
  liveDemoUrl?: string | null;
  zipSize?: number | null;
  fileHash?: string | null;
  status: string;
  version: number;
  versionNote?: string | null;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
  store: {
    id: string;
    name: string;
    slug: string;
    accent: number;
    ratingAvg?: number;
  };
  reviews: ReviewDTO[];
  similar: ProductCardDTO[];
  owned?: boolean; // buyer punya order Lunas
  canReview?: boolean;
  pendingOrderId?: string | null;
}

export interface StorePublicDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  accent: number;
  bannerUrl?: string | null;
  socials: { ig?: string; x?: string; tiktok?: string };
  status: string;
  stats: {
    productCount: number;
    ratingAvg: number;
    ratingCount: number;
    joinedYear: number;
  };
  products: ProductCardDTO[];
}

export interface OrderEventDTO {
  id: string;
  status: string;
  label: string;
  note?: string | null;
  actor: string;
  createdAt: string;
}

export interface ReceiptInfoDTO {
  id: string;
  fileName: string;
  amount?: number | null;
  transferAt?: string | null;
  senderName?: string | null;
  matchStatus?: string | null;
  manipulationSuspected?: boolean;
  createdAt: string;
}

export interface OrderDTO {
  id: string;
  code: string;
  status: string;
  verifyPath?: string | null;
  price: number;
  sellType: string;
  product: { id: string; title: string; slug: string; preview?: string | null; version: number };
  store: { id: string; name: string; slug: string; whatsapp?: string | null };
  buyer?: { id: string; name: string; email?: string };
  expiresAt?: string | null;
  paySessionStartedAt?: string | null;
  verifiedAt?: string | null;
  completedAt?: string | null;
  downloadUsedAt?: string | null;
  selfBuyFlag?: boolean;
  events: OrderEventDTO[];
  latestReceipt?: ReceiptInfoDTO | null;
  qrUrl?: string | null;
  commissionSnapshot?: number;
  canReview?: boolean;
  cancelReason?: string | null;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  type: string;
  title: string;
  body: string;
  linkQuery?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface InvoiceDTO {
  id: string;
  code: string;
  amount: number;
  status: string;
  issuedAt: string;
  dueAt: string;
  suspendAt: string;
  paidAt?: string | null;
  paidAmount?: number | null;
  paidMethod?: string | null;
  paidReference?: string | null;
  entryCount?: number;
  store?: { id: string; name: string; slug: string };
}

export interface SellerStatsDTO {
  verifiedTx: number;
  grossRevenue: number;
  commissionOwed: number;
  topProduct: { title: string; slug: string; sales: number } | null;
  chart: { date: string; tx: number; revenue: number }[];
  topProducts: { title: string; slug: string; sales: number; revenue: number }[];
}

export interface AdminOverviewDTO {
  gmv: number;
  verifiedTx: number;
  commissionCollected: number;
  commissionOutstanding: number;
  activeSellers: number;
  suspendedSellers: number;
  topSellerConcentration: number;
  totalProducts: number;
  totalBuyers: number;
  chart: { date: string; tx: number; ma7: number }[];
  topCategories: { category: string; count: number }[];
  pendingVerifications: number;
  openDisputes: number;
  outstandingInvoices: number;
}

export interface InspectionDTO {
  id: string;
  markdown: string;
  driveStatus: string;
  demoHttpStatus?: number | null;
  zipSize?: number | null;
  createdAt: string;
  trigger: string;
}

export interface AuditEntryDTO {
  id: string;
  actorType: string;
  action: string;
  decision?: string | null;
  reason?: string | null;
  payloadJson?: string;
  createdAt: string;
  productTitle?: string;
}

export interface VerificationItemDTO {
  productId: string;
  title: string;
  slug: string;
  storeName: string;
  storeSlug: string;
  category: string;
  status: string;
  submittedAt?: string | null;
  rejectedReason?: string | null;
  latestInspection?: InspectionDTO | null;
  audits: AuditEntryDTO[];
}

export interface DisputeDTO {
  id: string;
  code: string;
  title: string;
  body: string;
  category: string;
  status: string;
  openedByEmail: string;
  orderCode?: string | null;
  order?: { id: string; code: string; price: number; productTitle: string } | null;
  resolutionNote?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  events: { id: string; actor: string; note: string; createdAt: string }[];
}

export interface SellerRowDTO {
  store: { id: string; name: string; slug: string; status: string; createdAt: string; accent: number };
  ownerEmail: string;
  productCount: number;
  commissionOwed: number;
  verifiedTx: number;
  ratingAvg: number;
}

export interface EmailOutboxDTO {
  id: string;
  toEmail: string;
  subject: string;
  kind: string;
  status: string;
  createdAt: string;
}

export interface PlatformSettingsDTO {
  commissionAmount: number;
  invoiceThreshold: number;
  suspendThreshold: number;
  waTemplate: string;
  tosVersion: string;
}

export interface GeneratorBlockData {
  id: string;
  type: string;
  content: string;
}

export interface ChangelogDTO {
  id: string;
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
  url?: string | null;
}
