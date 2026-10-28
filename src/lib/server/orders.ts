// =============================================================================
// Althentic.Dev - Order state machine (GAP-01/11, SPEC-02/04/07)
// pending_payment → payment_submitted → verified/rejected → completed
// cabang cancelled / expired. "Booked" = label buyer saat jalur manual/AI gagal.
// Produk TETAP bisa dibeli paralel (bukan exclusive lock).
// =============================================================================

import { db } from "@/lib/db";
import { randomCode } from "@/lib/server/helpers";
import { getSettings } from "@/lib/server/settings";
import { notifyUser } from "@/lib/server/notifications";
import {
  tplOrderCreated,
  tplReceiptReceived,
  tplOrderVerified,
  tplOrderRejected,
  tplOrderCancelled,
  tplOrderExpired,
  tplManualNoResponse,
  tplSellerNewOrder,
} from "@/lib/server/email";
import { processCommissionThreshold, recordLedgerForVerifiedOrder } from "@/lib/server/commission";
import { ORDER_EXPIRY_HOURS, MANUAL_RESPONSE_HOURS } from "@/lib/constants";

export async function addEvent(
  orderId: string,
  status: string,
  label: string,
  actor: string,
  note?: string
) {
  await db.orderEvent.create({
    data: { orderId, status, label, actor, note: note ?? null },
  });
}

export async function createOrder(p: {
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  buyerIp?: string;
  productId: string;
  sellType: string;
}) {
  const product = await db.product.findUnique({
    where: { id: p.productId },
    include: { store: { include: { owner: true } } },
  });
  if (!product || product.status !== "active") {
    throw Object.assign(new Error("Produk tidak tersedia untuk dibeli."), { status: 400 });
  }
  if (product.store.status === "suspended" || product.store.status === "preparing") {
    throw Object.assign(new Error("Toko sedang tidak menerima order."), { status: 400 });
  }
  const sellTypes = JSON.parse(product.sellTypesJson) as {
    type: string;
    price: number;
    driveFileId?: string;
  }[];
  const st = sellTypes.find((s) => s.type === p.sellType);
  if (!st) throw Object.assign(new Error("Tipe jual tidak valid."), { status: 400 });

  const settings = await getSettings();
  const expiresAt = new Date(Date.now() + ORDER_EXPIRY_HOURS * 3600 * 1000); // GAP-11

  // Deteksi self-buy sinyal IP (SPEC-16-12; fingerprint perangkat di-skip GAP-21)
  const sellerLastIp = product.store.owner.lastLoginIp ?? null;
  const selfBuyFlag = !!p.buyerIp && !!sellerLastIp && p.buyerIp === sellerLastIp;

  const order = await db.order.create({
    data: {
      code: randomCode("ALT"),
      buyerId: p.buyerId,
      storeId: product.storeId,
      productId: product.id,
      sellType: p.sellType,
      price: st.price, // harga terkunci (SPEC-02-10)
      commissionSnapshot: settings.commissionAmount, // difinalkan saat verified (GAP-16)
      status: "pending_payment",
      expiresAt,
      buyerIp: p.buyerIp ?? null,
      selfBuyFlag,
    },
  });
  await addEvent(order.id, "pending_payment", "Order dibuat", "buyer", `Order ${order.code} dibuat`);

  // Email + notifikasi buyer (SPEC-04-06 #1) & seller (SPEC-04-07)
  await notifyUser({
    userId: p.buyerId,
    type: "order_update",
    title: `Order ${order.code} dibuat`,
    body: `Tekan "Bayar Sekarang" di halaman order, scan QR ${product.store.name}, lalu upload bukti transfer.`,
    linkQuery: `v=checkout&id=${order.id}`,
    email: {
      to: p.buyerEmail,
      subject: `Order ${order.code} - instruksi pembayaran`,
      body: tplOrderCreated({
        buyerName: p.buyerName,
        orderCode: order.code,
        productTitle: product.title,
        price: st.price,
        storeName: product.store.name,
        qrNote: st.price === 0 ? "Produk ini gratis - cukup konfirmasi tanpa transfer." : "QR akan tampil setelah kamu menekan Bayar Sekarang.",
      }),
      kind: "order_created",
    },
  });
  await notifyUser({
    userId: product.store.ownerId,
    type: "order_update",
    title: `Order baru: ${product.title}`,
    body: `Order ${order.code} dari ${p.buyerName} senilai Rp${st.price.toLocaleString("id-ID")}.`,
    linkQuery: `v=dashboard&tab=orders`,
    email: {
      to: product.store.owner.email,
      subject: `Order baru masuk: ${order.code}`,
      body: tplSellerNewOrder({
        sellerName: product.store.name,
        orderCode: order.code,
        productTitle: product.title,
        price: st.price,
      }),
      kind: "seller_new_order",
    },
  });
  return order;
}

export async function startPaySession(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "pending_payment") return order;
  if (!order.paySessionStartedAt) {
    await db.order.updateMany({
      where: { id: orderId, status: "pending_payment", paySessionStartedAt: null },
      data: { paySessionStartedAt: new Date() },
    });
  }
  return db.order.findUnique({ where: { id: orderId } });
}

/** Order diverifikasi (AI lolos / seller manual approve). */
export async function verifyOrder(p: {
  orderId: string;
  actor: "ai" | "seller" | "superadmin" | "system";
  checklist?: boolean[];
  note?: string;
}) {
  const order = await db.order.findUnique({
    where: { id: p.orderId },
    include: { product: { include: { store: { include: { owner: true } } } }, buyer: true },
  });
  if (!order) throw Object.assign(new Error("Order tidak ditemukan."), { status: 404 });
  if (order.status !== "payment_submitted") {
    throw Object.assign(new Error(`Order berstatus ${order.status}, tidak bisa diverifikasi.`), { status: 400 });
  }

  // Snapshot komisi FINAL saat verified (GAP-16)
  const settings = await getSettings();
  const commissionSnapshot = settings.commissionAmount;

  const updated = await db.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: order.id, status: "payment_submitted" },
      data: {
        status: "verified",
        verifiedAt: new Date(),
        commissionSnapshot,
        manualChecklistJson:
          p.actor === "seller" && p.checklist ? JSON.stringify(p.checklist) : order.manualChecklistJson,
      },
    });
    if (changed.count !== 1) {
      throw Object.assign(new Error("Order sudah diproses oleh request lain."), { status: 409 });
    }

    const verified = await tx.order.findUnique({ where: { id: order.id } });
    if (!verified) throw Object.assign(new Error("Order tidak ditemukan."), { status: 404 });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        status: "verified",
        label: p.actor === "seller" ? "Diverifikasi manual oleh seller" : p.actor === "ai" ? "Diverifikasi AI Receipt Scanner" : "Diverifikasi",
        actor: p.actor,
        note: p.note ?? null,
      },
    });
    await recordLedgerForVerifiedOrder(tx, verified);
    await tx.product.update({
      where: { id: order.productId },
      data: { salesCount: { increment: 1 } },
    });
    return verified;
  });

  // Proses invoice dan notifikasi setelah ledger transaksi tersimpan atomik.
  if (order.price > 0) await processCommissionThreshold(order.storeId);

  await notifyUser({
    userId: order.buyerId,
    type: "order_update",
    title: `Pembayaran terverifikasi - ${order.product.title}`,
    body: "Status Lunas. File bisa diunduh dari Koleksi Saya (kuota unduh 1x).",
    linkQuery: `v=collection`,
    email: {
      to: order.buyer.email,
      subject: `Order ${order.code} lunas - file siap diunduh`,
      body: tplOrderVerified({
        buyerName: order.buyer.name,
        orderCode: order.code,
        productTitle: order.product.title,
      }),
      kind: "order_verified",
    },
  });
  return updated;
}

export async function rejectOrder(p: { orderId: string; reason: string; actor: "ai" | "seller" | "system"; note?: string }) {
  const order = await db.order.findUnique({
    where: { id: p.orderId },
    include: { buyer: true, product: true },
  });
  if (!order) throw Object.assign(new Error("Order tidak ditemukan."), { status: 404 });
  if (order.status !== "payment_submitted") {
    throw Object.assign(new Error(`Order berstatus ${order.status}.`), { status: 400 });
  }
  const changed = await db.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: order.id, status: "payment_submitted" },
      data: { status: "rejected" },
    });
    if (result.count !== 1) return false;
    await tx.orderEvent.create({
      data: { orderId: order.id, status: "rejected", label: "Bukti ditolak", actor: p.actor, note: p.reason },
    });
    return true;
  });
  if (!changed) throw Object.assign(new Error("Order sudah diproses oleh request lain."), { status: 409 });
  await notifyUser({
    userId: order.buyerId,
    type: "order_update",
    title: `Bukti transfer ditolak - ${order.code}`,
    body: `${p.reason} Upload ulang bukti sebelum order kedaluwarsa.`,
    linkQuery: `v=checkout&id=${order.id}`,
    email: {
      to: order.buyer.email,
      subject: `Verifikasi gagal - ${order.code}`,
      body: tplOrderRejected({
        buyerName: order.buyer.name,
        orderCode: order.code,
        reason: p.reason,
      }),
      kind: "order_rejected",
    },
  });
}

/** Order batal (buyer 1 klik sebelum Lunas - SPEC-04-08 / GAP-01). */
export async function cancelOrder(orderId: string, reason: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { buyer: true } });
  if (!order) throw Object.assign(new Error("Order tidak ditemukan."), { status: 404 });
  if (!["pending_payment", "payment_submitted", "rejected"].includes(order.status)) {
    throw Object.assign(new Error("Order sudah Lunas - gunakan jalur dispute."), { status: 400 });
  }
  const now = new Date();
  const changed = await db.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: orderId, status: { in: ["pending_payment", "payment_submitted", "rejected"] } },
      data: { status: "cancelled", cancelledAt: now, cancelReason: reason },
    });
    if (result.count !== 1) return false;
    await tx.orderEvent.create({
      data: { orderId, status: "cancelled", label: "Dibatalkan buyer", actor: "buyer", note: reason },
    });
    return true;
  });
  if (!changed) throw Object.assign(new Error("Order sudah diproses oleh request lain."), { status: 409 });
  await notifyUser({
    userId: order.buyerId,
    type: "order_update",
    title: `Order ${order.code} dibatalkan`,
    body: reason,
    linkQuery: `v=orders`,
    email: {
      to: order.buyer.email,
      subject: `Order ${order.code} dibatalkan`,
      body: tplOrderCancelled({ buyerName: order.buyer.name, orderCode: order.code, reason }),
      kind: "order_cancelled",
    },
  });
}

/** Kedaluwarsa (tanpa progres 24 jam dari checkout - GAP-11). */
export async function expireOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { buyer: true, product: { select: { slug: true } } },
  });
  if (!order || !["pending_payment", "payment_submitted", "rejected"].includes(order.status)) return;
  const now = new Date();
  const changed = await db.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: orderId, status: { in: ["pending_payment", "payment_submitted", "rejected"] }, expiresAt: { lte: now } },
      data: { status: "expired", expiredAt: now },
    });
    if (result.count !== 1) return false;
    await tx.orderEvent.create({
      data: { orderId, status: "expired", label: "Kedaluwarsa (24 jam tanpa progres)", actor: "system" },
    });
    return true;
  });
  if (!changed) return;
  await notifyUser({
    userId: order.buyerId,
    type: "order_update",
    title: `Order ${order.code} kedaluwarsa`,
    body: "Tidak ada progres dalam 24 jam. Kamu bisa order ulang kapan saja.",
    linkQuery: `v=product&id=${order.product.slug}`,
    email: {
      to: order.buyer.email,
      subject: `Order ${order.code} kedaluwarsa`,
      body: tplOrderExpired({ buyerName: order.buyer.name, orderCode: order.code }),
      kind: "order_expired",
    },
  });
}

/** Order manual tanpa respons 24 jam → batal otomatis (SPEC-02-07). */
export async function autoCancelUnresponded(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { buyer: true, product: { include: { store: { include: { owner: true } } } } },
  });
  if (!order || order.status !== "payment_submitted" || (order.verifyPath !== "manual" && order.verifyPath !== "wa")) return;
  const now = new Date();
  const deadline = new Date(now.getTime() - MANUAL_RESPONSE_HOURS * 3600 * 1000);
  const changed = await db.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: {
        id: orderId,
        status: "payment_submitted",
        verifyPath: { in: ["manual", "wa"] },
        updatedAt: { lte: deadline },
      },
      data: { status: "cancelled", cancelledAt: now, cancelReason: "Tidak ada respons seller 24 jam" },
    });
    if (result.count !== 1) return false;
    await tx.orderEvent.create({
      data: { orderId, status: "cancelled", label: "Batal otomatis - seller tidak merespons 24 jam", actor: "system" },
    });
    return true;
  });
  if (!changed) return;
  await notifyUser({
    userId: order.buyerId,
    type: "order_update",
    title: `Order ${order.code} dibatalkan otomatis`,
    body: "Seller tidak merespons dalam 24 jam. Kamu boleh reorder.",
    linkQuery: `v=product&id=${order.product.slug}`,
    email: {
      to: order.buyer.email,
      subject: `Order ${order.code} dibatalkan otomatis`,
      body: tplManualNoResponse({ buyerName: order.buyer.name, orderCode: order.code }),
      kind: "order_manual_cancelled",
    },
  });
  // Peringatan kinerja pertama ke seller
  await notifyUser({
    userId: order.product.store.ownerId,
    type: "system",
    title: "Peringatan kinerja: order tanpa respons",
    body: `Order ${order.code} dibatalkan otomatis karena tidak ada respons manual dalam 24 jam.`,
    linkQuery: `v=dashboard&tab=orders`,
    email: {
      to: order.product.store.owner.email,
      subject: `Peringatan kinerja - order ${order.code} batal otomatis`,
      body: `Halo ${order.product.store.name}, order ${order.code} batal otomatis karena tidak diverifikasi manual dalam ${MANUAL_RESPONSE_HOURS} jam. Ini peringatan kinerja pertama tokomu.`,
      kind: "seller_performance_warning",
    },
  });
}

/** Konsumsi kuota unduh dan audit log secara atomik untuk mencegah klaim paralel. */
export async function markDownloadUsed(p: {
  orderId: string;
  userId: string;
  actor: "buyer" | "superadmin";
  ip?: string;
  userAgent?: string;
}): Promise<Date | null> {
  return db.$transaction(async (tx) => {
    const now = new Date();
    const claimed = await tx.order.updateMany({
      where: {
        id: p.orderId,
        downloadUsedAt: null,
        status: { in: ["verified", "completed"] },
      },
      data: { downloadUsedAt: now, status: "completed", completedAt: now },
    });
    if (claimed.count !== 1) return null;

    await tx.orderEvent.create({
      data: {
        orderId: p.orderId,
        status: "completed",
        label: "File diunduh (kuota 1x terpakai)",
        actor: p.actor,
      },
    });
    await tx.downloadLog.create({
      data: {
        orderId: p.orderId,
        userId: p.userId,
        ip: p.ip ?? null,
        userAgent: p.userAgent ?? null,
        status: "started",
        createdAt: now,
      },
    });
    return now;
  });
}

/** Pulihkan klaim hanya bila pengambilan upstream gagal sebelum stream dikirim. */
export async function restoreDownloadClaim(p: {
  orderId: string;
  userId: string;
  claimedAt: Date;
}): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const restored = await tx.order.updateMany({
      where: {
        id: p.orderId,
        status: "completed",
        downloadUsedAt: p.claimedAt,
      },
      data: { downloadUsedAt: null, status: "verified", completedAt: null },
    });
    if (restored.count !== 1) return false;

    await tx.downloadLog.updateMany({
      where: {
        orderId: p.orderId,
        userId: p.userId,
        status: "started",
        createdAt: p.claimedAt,
      },
      data: { status: "failed" },
    });
    await tx.orderEvent.create({
      data: {
        orderId: p.orderId,
        status: "verified",
        label: "Pengambilan file gagal sebelum stream dimulai; kuota dipulihkan",
        actor: "system",
      },
    });
    return true;
  });
}

/** Tandai hasil stream pada log tanpa mengubah kuota yang sudah mulai dipakai. */
export async function finishDownloadLog(p: {
  orderId: string;
  userId: string;
  claimedAt: Date;
  status: "completed" | "failed";
}): Promise<void> {
  await db.downloadLog.updateMany({
    where: {
      orderId: p.orderId,
      userId: p.userId,
      createdAt: p.claimedAt,
      status: "started",
    },
    data: { status: p.status },
  });
}
