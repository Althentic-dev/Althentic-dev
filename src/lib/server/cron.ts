// =============================================================================
// Althentic.Dev — Maintenance / cron (Vercel Cron Jobs pattern, GAP-19)
// Endpoint /api/cron/maintenance dengan CRON_SECRET. Super-Admin juga bisa
// menjalankan manual dari dashboard. Job:
// - Expire order tanpa progres 24 jam (GAP-11)
// - Auto-cancel order manual tanpa respons 24 jam (SPEC-02-07)
// - Reminder invoice hari 1/3/5 + suspend hari ke-8 (GAP-03, SPEC-09-02)
// - Pengingat produk ditolak hari ke-7 + arsip otomatis hari ke-14 (SPEC-08-03)
// - Penghapusan fisik file bukti setelah 30 hari (GAP-04) — metadata 90 hari
// - Notifikasi update ZIP inti ke buyer lama (GAP-05) — dipicu saat update, bukan cron
// =============================================================================

import { db } from "@/lib/db";
import { expireOrder, autoCancelUnresponded } from "@/lib/server/orders";
import { runInvoiceReminders, runSuspendOverdue } from "@/lib/server/commission";
import { notifyUser } from "@/lib/server/notifications";
import { deleteObject } from "@/lib/server/storage";
import { MANUAL_RESPONSE_HOURS, RETENTION_RECEIPT_DAYS } from "@/lib/constants";

export interface MaintenanceReport {
  expiredOrders: number;
  autoCancelled: number;
  remindersSent: number;
  suspendedStores: number;
  rejectReminders: number;
  autoArchived: number;
  receiptsDeleted: number;
  ranAt: string;
}

export async function runMaintenance(): Promise<MaintenanceReport> {
  const now = new Date();
  const report: MaintenanceReport = {
    expiredOrders: 0,
    autoCancelled: 0,
    remindersSent: 0,
    suspendedStores: 0,
    rejectReminders: 0,
    autoArchived: 0,
    receiptsDeleted: 0,
    ranAt: now.toISOString(),
  };

  // 1. Expire order tanpa progres (semua jalur) — 24 jam dari checkout
  const stale = await db.order.findMany({
    where: {
      status: { in: ["pending_payment", "payment_submitted", "rejected"] },
      expiresAt: { lte: now },
    },
    select: { id: true },
  });
  for (const o of stale) {
    await expireOrder(o.id);
    report.expiredOrders++;
  }

  // 2. Auto-cancel order manual tanpa respons seller 24 jam (SPEC-02-07)
  const manualDeadline = new Date(now.getTime() - MANUAL_RESPONSE_HOURS * 3600 * 1000);
  const manual = await db.order.findMany({
    where: {
      status: "payment_submitted",
      verifyPath: { in: ["manual", "wa"] },
      updatedAt: { lte: manualDeadline },
    },
    select: { id: true },
  });
  for (const o of manual) {
    await autoCancelUnresponded(o.id);
    report.autoCancelled++;
  }

  // 3. Reminder invoice hari 1/3/5 (SPEC-09-02)
  const reminders = await runInvoiceReminders();
  report.remindersSent = reminders.sent;

  // 4. Suspend hari ke-8 (GAP-03)
  const suspended = await runSuspendOverdue();
  report.suspendedStores = suspended.suspended;

  // 5. Produk ditolak: pengingat hari ke-7, arsip hari ke-14 (SPEC-08-03)
  const rejected = await db.product.findMany({
    where: { status: "rejected", rejectedAt: { not: null } },
    include: { store: { include: { owner: true } } },
  });
  for (const p of rejected) {
    if (!p.rejectedAt) continue;
    const days = Math.floor((now.getTime() - p.rejectedAt.getTime()) / (24 * 3600 * 1000));
    if (days >= 14) {
      await db.product.update({ where: { id: p.id }, data: { status: "archived" } });
      report.autoArchived++;
    } else if (days >= 7) {
      const exists = await db.notification.findFirst({
        where: {
          userId: p.store.ownerId,
          title: { contains: `Pengingat perbaikan:${p.id}` },
        },
      });
      if (!exists) {
        await notifyUser({
          userId: p.store.ownerId,
          type: "verification_result",
          title: `Pengingat perbaikan:${p.id} — ${p.title}`,
          body: "Produk ditolak 7 hari lalu dan belum diperbaiki. Arsip otomatis pada hari ke-14.",
          linkQuery: `v=dashboard&tab=products`,
          email: {
            to: p.store.owner.email,
            subject: `Pengingat: produk "${p.title}" akan diarsipkan`,
            body: `Produk "${p.title}" ditolak 7 hari lalu dan belum dikirim ulang. Produk otomatis masuk arsip pada hari ke-14 sejak penolakan.`,
            kind: "product_repair_reminder",
          },
        });
        report.rejectReminders++;
      }
    }
  }

  // 6. Penghapusan fisik file bukti > 30 hari (GAP-04) — metadata tetap
  const oldReceipts = await db.receipt.findMany({
    where: { filePath: { not: null }, deletedAt: null, createdAt: { lte: new Date(now.getTime() - RETENTION_RECEIPT_DAYS * 24 * 3600 * 1000) } },
  });
  for (const r of oldReceipts) {
    if (r.filePath) {
      const [bucket, ...rest] = r.filePath.split("/");
      await deleteObject(bucket === "private" ? "private" : "public", rest.join("/"));
    }
    await db.receipt.update({ where: { id: r.id }, data: { filePath: null, deletedAt: now } });
    report.receiptsDeleted++;
  }

  return report;
}
