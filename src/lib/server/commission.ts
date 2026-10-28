// =============================================================================
// Althentic.Dev — Komisi, invoice, dan suspend (SPEC-09, GAP-03, GAP-09, GAP-16)
// - Ledger per event transaksi verified; order batal/expired TIDAK masuk (SPEC-09-05)
// - Prompt gratis Rp0 → tidak kena komisi (GAP-16)
// - Invoice terbit otomatis saat threshold tercapai → grace 7 hari → suspend
//   di awal hari ke-8 (GAP-03)
// - Counter terus bertambah saat invoice belum lunas; reset hanya porsi yang
//   tercakup invoice yang Lunas (GAP-09)
// - Bayar lebih → kredit invoice berikutnya; kurang → tetap belum lunas (GAP-16)
// =============================================================================

import { db } from "@/lib/db";
import { randomCode } from "@/lib/server/helpers";
import { getSettings } from "@/lib/server/settings";
import { notifyUser } from "@/lib/server/notifications";
import {
  tplInvoiceIssued,
  tplInvoiceReminder,
  tplSuspended,
  tplCommissionWarning,
} from "@/lib/server/email";
import { GRACE_PERIOD_DAYS } from "@/lib/constants";

export async function commissionOwed(storeId: string): Promise<number> {
  const entries = await db.commissionLedger.findMany({
    where: { storeId, status: { not: "settled" } },
    select: { amount: true },
  });
  return entries.reduce((a, e) => a + e.amount, 0);
}

export async function uninvoicedOpen(storeId: string): Promise<number> {
  const entries = await db.commissionLedger.findMany({
    where: { storeId, status: "open" },
    select: { amount: true },
  });
  return entries.reduce((a, e) => a + e.amount, 0);
}

/** Dipanggil saat order verified: catat ledger + cek threshold invoice. */
export async function recordLedgerAndMaybeInvoice(orderId: string): Promise<void> {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { store: true } });
  if (!order) return;
  if (order.price === 0) return; // prompt gratis: tanpa komisi (GAP-16)

  await db.commissionLedger.create({
    data: {
      storeId: order.storeId,
      orderId: order.id,
      amount: order.commissionSnapshot,
      status: "open",
    },
  });

  await maybeIssueInvoice(order.storeId);
  await maybeWarnThreshold(order.storeId);
}

async function maybeWarnThreshold(storeId: string) {
  const settings = await getSettings();
  const store = await db.store.findUnique({ where: { id: storeId }, include: { owner: true } });
  if (!store || store.status === "suspended") return;
  const owed = await commissionOwed(storeId);
  const pct = owed / Math.max(settings.suspendThreshold, 1);
  if ((pct >= 0.5 && pct < 0.8) || pct >= 0.8) {
    // peringatan 50% / 80% (SPEC-01-06) — kirim sekali per ambang
    const key = pct >= 0.8 ? "warn80" : "warn50";
    const existing = await db.notification.findFirst({
      where: { userId: store.ownerId, title: { contains: `${key}:${owed}` } },
    });
    if (!existing) {
      await notifyUser({
        userId: store.ownerId,
        type: "invoice",
        title: `Peringatan tunggakan ${key}:${owed} — ${Math.round(pct * 100)}% dari batas`,
        body: `Commission Owed Rp${owed.toLocaleString("id-ID")} sudah ${Math.round(pct * 100)}% dari batas suspend.`,
        linkQuery: `v=dashboard&tab=commissions`,
        email: {
          to: store.owner.email,
          subject: `Peringatan tunggakan komisi (${Math.round(pct * 100)}%)`,
          body: tplCommissionWarning({
            sellerName: store.name,
            owed,
            threshold: settings.suspendThreshold,
            percent: Math.round(pct * 100),
          }),
          kind: "commission_warning",
        },
      });
    }
  }
}

/** Invoice otomatis saat Commission Owed (entri open) mencapai threshold. */
export async function maybeIssueInvoice(storeId: string): Promise<void> {
  const settings = await getSettings();
  const open = await uninvoicedOpen(storeId);
  if (open < settings.invoiceThreshold) return;

  const store = await db.store.findUnique({ where: { id: storeId }, include: { owner: true } });
  if (!store) return;

  const entries = await db.commissionLedger.findMany({
    where: { storeId, status: "open" },
    orderBy: { createdAt: "asc" },
  });
  const amount = entries.reduce((a, e) => a + e.amount, 0);
  const issuedAt = new Date();
  const dueAt = new Date(issuedAt.getTime() + GRACE_PERIOD_DAYS * 24 * 3600 * 1000);
  // Suspend di AWAL hari ke-8 (GAP-03)
  const suspendAt = new Date(dueAt);
  suspendAt.setHours(0, 0, 0, 0);

  const invoice = await db.invoice.create({
    data: {
      code: randomCode("INV"),
      storeId,
      amount,
      issuedAt,
      dueAt,
      suspendAt,
      status: "outstanding",
    },
  });
  await db.commissionLedger.updateMany({
    where: { id: { in: entries.map((e) => e.id) } },
    data: { status: "invoiced", invoiceId: invoice.id },
  });

  await notifyUser({
    userId: store.ownerId,
    type: "invoice",
    title: `Invoice komisi ${invoice.code} terbit`,
    body: `Tunggakan Rp${amount.toLocaleString("id-ID")} — lunasi sebelum ${suspendAt.toLocaleDateString("id-ID")} agar toko tidak suspend.`,
    linkQuery: `v=dashboard&tab=commissions`,
    email: {
      to: store.owner.email,
      subject: `Invoice komisi ${invoice.code} — Rp${amount.toLocaleString("id-ID")}`,
      body: tplInvoiceIssued({
        sellerName: store.name,
        invoiceCode: invoice.code,
        amount,
        dueDate: suspendAt.toLocaleDateString("id-ID"),
        payNote: "Pembayaran komisi diverifikasi manual oleh Super-Admin (tanpa AI). Kirim bukti ke tim Althentic setelah transfer.",
      }),
      kind: "invoice_issued",
    },
  });
}

/** Reminder hari 1, 3, 5 (SPEC-09-02) + banner kuning 3 hari (frontend). */
export async function runInvoiceReminders(): Promise<{ sent: number }> {
  const now = new Date();
  const invoices = await db.invoice.findMany({
    where: { status: "outstanding" },
    include: { store: { include: { owner: true } } },
  });
  let sent = 0;
  for (const inv of invoices) {
    const day = Math.floor((now.getTime() - inv.issuedAt.getTime()) / (24 * 3600 * 1000));
    const reminders = JSON.parse(inv.remindersJson || "[]") as number[];
    for (const d of [1, 3, 5]) {
      if (day >= d && !reminders.includes(d)) {
        await notifyUser({
          userId: inv.store.ownerId,
          type: "invoice",
          title: `Pengingat invoice ${inv.code} (hari ke-${d})`,
          body: `Tunggakan Rp${inv.amount.toLocaleString("id-ID")}. Suspend otomatis: ${inv.suspendAt.toLocaleDateString("id-ID")}.`,
          linkQuery: `v=dashboard&tab=commissions`,
          email: {
            to: inv.store.owner.email,
            subject: `Pengingat invoice ${inv.code} — hari ke-${d}`,
            body: tplInvoiceReminder({
              sellerName: inv.store.name,
              invoiceCode: inv.code,
              amount: inv.amount,
              suspendDate: inv.suspendAt.toLocaleDateString("id-ID"),
            }),
            kind: "invoice_reminder",
          },
        });
        reminders.push(d);
        sent++;
      }
    }
    if (reminders.length !== JSON.parse(inv.remindersJson || "[]").length) {
      await db.invoice.update({
        where: { id: inv.id },
        data: { remindersJson: JSON.stringify(reminders) },
      });
    }
  }
  return { sent };
}

/** Suspend hari ke-8 awal hari bila invoice belum lunas (GAP-03). */
export async function runSuspendOverdue(): Promise<{ suspended: number }> {
  const now = new Date();
  const overdue = await db.invoice.findMany({
    where: { status: "outstanding", suspendAt: { lte: now } },
    include: { store: { include: { owner: true } } },
  });
  let suspended = 0;
  for (const inv of overdue) {
    if (inv.store.status === "suspended") continue;
    await suspendStore(inv.storeId, `Invoice komisi ${inv.code} belum lunas setelah grace period 7 hari.`);
    suspended++;
  }
  return { suspended };
}

export async function suspendStore(storeId: string, reason: string): Promise<void> {
  const store = await db.store.findUnique({ where: { id: storeId }, include: { owner: true } });
  if (!store) return;
  await db.store.update({
    where: { id: storeId },
    data: { status: "suspended", suspendedAt: new Date(), suspendReason: reason },
  });
  // Produk disembunyikan dari katalog (SPEC-09-01) — status query filter 'suspended'
  await notifyUser({
    userId: store.ownerId,
    type: "system",
    title: "Toko Anda di-suspend",
    body: reason,
    linkQuery: `v=dashboard&tab=commissions`,
    email: {
      to: store.owner.email,
      subject: "Toko Anda di-suspend — tunggakan komisi",
      body: tplSuspended({ sellerName: store.name, reason }),
      kind: "store_suspended",
    },
  });
}

export async function unsuspendStore(storeId: string): Promise<void> {
  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store) return;
  // Pulihkan status sebelumnya (live bila punya produk terverifikasi)
  const hasActive = await db.product.count({ where: { storeId, status: "active" } });
  await db.store.update({
    where: { id: storeId },
    data: {
      status: hasActive > 0 ? "live" : "ready",
      suspendedAt: null,
      suspendReason: null,
    },
  });
}

/**
 * Verifikasi pembayaran komisi oleh Super-Admin (SPEC-09-06, GAP-16).
 * Form: invoice, nominal diterima, tanggal bayar, metode, referensi opsional.
 */
export async function verifyInvoicePayment(p: {
  invoiceId: string;
  superAdminId: string;
  paidAmount: number;
  paidAt: Date;
  paidMethod: string;
  paidReference?: string;
  paidNote?: string;
}): Promise<{ ok: boolean; message: string }> {
  const inv = await db.invoice.findUnique({
    where: { id: p.invoiceId },
    include: { store: { include: { owner: true } }, entries: true },
  });
  if (!inv) throw Object.assign(new Error("Invoice tidak ditemukan."), { status: 404 });

  if (p.paidAmount < inv.amount) {
    // Bayar kurang: invoice tetap belum lunas (GAP-16) — catat saja
    await db.invoice.update({
      where: { id: inv.id },
      data: {
        paidAmount: p.paidAmount,
        paidAt: p.paidAt,
        paidMethod: p.paidMethod,
        paidReference: p.paidReference ?? null,
        paidNote:
          (p.paidNote ? p.paidNote + " " : "") +
          `[Pembayaran kurang: diterima Rp${p.paidAmount.toLocaleString("id-ID")} dari Rp${inv.amount.toLocaleString("id-ID")} — invoice tetap belum lunas]`,
      },
    });
    await notifyUser({
      userId: inv.store.ownerId,
      type: "invoice",
      title: `Pembayaran komisi kurang — ${inv.code}`,
      body: `Diterima Rp${p.paidAmount.toLocaleString("id-ID")} dari Rp${inv.amount.toLocaleString("id-ID")}. Invoice tetap belum lunas.`,
      linkQuery: `v=dashboard&tab=commissions`,
    });
    return { ok: false, message: "Pembayaran kurang — invoice tetap belum lunas (dicatat)." };
  }

  const credit = p.paidAmount - inv.amount; // kelebihan → kredit (GAP-16)
  await db.invoice.update({
    where: { id: inv.id },
    data: {
      status: "paid",
      paidAt: p.paidAt,
      paidAmount: p.paidAmount,
      paidMethod: p.paidMethod,
      paidReference: p.paidReference ?? null,
      paidNote: p.paidNote ?? null,
      verifiedBy: p.superAdminId,
    },
  });
  // Entry tercakup invoice ini → settled; counter reset utk porsi itu (GAP-09)
  await db.commissionLedger.updateMany({
    where: { invoiceId: inv.id },
    data: { status: "settled" },
  });
  if (credit > 0) {
    await db.store.update({
      where: { id: inv.storeId },
      data: { commissionCredit: { increment: credit } },
    });
  }
  if (inv.store.status === "suspended") {
    await unsuspendStore(inv.storeId);
  }
  // Kredit otomatis dipakai untuk invoice berikutnya yang terbit
  await notifyUser({
    userId: inv.store.ownerId,
    type: "invoice",
    title: `Invoice ${inv.code} lunas`,
    body:
      credit > 0
        ? `Terima kasih! Kelebihan Rp${credit.toLocaleString("id-ID")} menjadi saldo kredit untuk invoice berikutnya.`
        : "Terima kasih! Invoice komisi Anda telah lunas.",
    linkQuery: `v=dashboard&tab=commissions`,
  });
  return { ok: true, message: "Invoice lunas. Counter komisi direset untuk porsi tercakup." };
}

/** Kredit store dipakai untuk mengurangi invoice baru (GAP-16: saldo kredit). */
export async function applyCreditToInvoice(invoiceId: string): Promise<void> {
  const inv = await db.invoice.findUnique({ where: { id: invoiceId }, include: { store: true } });
  if (!inv || inv.store.commissionCredit <= 0) return;
  const use = Math.min(inv.store.commissionCredit, inv.amount);
  if (use <= 0) return;
  await db.store.update({
    where: { id: inv.storeId },
    data: { commissionCredit: { decrement: use } },
  });
  // Kurangi amount invoice dengan kredit — invoice tetap satu record
  await db.invoice.update({
    where: { id: invoiceId },
    data: {
      amount: inv.amount - use,
      paidNote: `Kredit saldo diterapkan: Rp${use.toLocaleString("id-ID")}`,
    },
  });
}
