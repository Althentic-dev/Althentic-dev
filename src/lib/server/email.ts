// =============================================================================
// Althentic.Dev - Email (Nodemailer, SPEC-04-06/07, SPEC-09-03, SPEC-15-05)
// Sandbox: SMTP tidak dikonfigurasi → email dicatat ke EmailOutbox (status
// "logged") dan dapat dilihat Super-Admin. Production: set SMTP_* env.
// =============================================================================

import nodemailer from "nodemailer";
import { db } from "@/lib/db";

export interface EmailPayload {
  to: string;
  subject: string;
  body: string; // plain text sudah ter-render (ID/EN per preferensi user)
  kind: string;
  relatedId?: string;
}

const hasSmtp = !!process.env.SMTP_HOST;

async function getTransporter() {
  if (!hasSmtp) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  // Selalu catat ke outbox (audit + sandbox visibility)
  await db.emailOutbox.create({
    data: {
      toEmail: payload.to,
      subject: payload.subject,
      body: payload.body,
      kind: payload.kind,
      status: hasSmtp ? "sent" : "logged",
      relatedId: payload.relatedId,
    },
  });
  if (hasSmtp) {
    try {
      const transporter = await getTransporter();
      await transporter?.sendMail({
        from: process.env.SMTP_FROM ?? "Althentic.Dev <no-reply@althentic.dev>",
        to: payload.to,
        subject: payload.subject,
        text: payload.body,
      });
    } catch (err) {
      console.error(
        JSON.stringify({ level: "error", time: new Date().toISOString(), message: `email_send_failed: ${(err as Error).message}` })
      );
    }
  }
}

// ---------------- Template email (Bahasa Indonesia default) ----------------

export function tplOrderCreated(p: {
  buyerName: string;
  orderCode: string;
  productTitle: string;
  price: number;
  storeName: string;
  qrNote: string;
}) {
  return `Halo ${p.buyerName},

Order kamu berhasil dibuat: ${p.orderCode}
Produk: ${p.productTitle}
Toko: ${p.storeName}
Nominal: Rp${p.price.toLocaleString("id-ID")}

Cara bayar:
1. Buka halaman order kamu di Althentic.Dev
2. Tekan "Bayar Sekarang" untuk memulai sesi pembayaran
3. Scan QR bisnis milik ${p.storeName} yang tampil di layar
4. Upload bukti transfer dalam jendela sesi

${p.qrNote}

Butuh bantuan? Buka halaman Dokumentasi > Panduan Buyer.`;
}

export function tplReceiptReceived(p: { buyerName: string; orderCode: string }) {
  return `Halo ${p.buyerName},

Bukti transfer untuk order ${p.orderCode} sudah kami terima dan sedang diverifikasi. Kamu akan mendapat kabar berikutnya setelah proses verifikasi selesai.`;
}

export function tplOrderVerified(p: { buyerName: string; orderCode: string; productTitle: string }) {
  return `Halo ${p.buyerName},

Verifikasi pembayaran order ${p.orderCode} BERHASIL. Status order kamu kini Lunas.

File produk "${p.productTitle}" sudah bisa diunduh dari halaman Koleksi Saya.
Penting: kuota unduh hanya 1 kali per order - pastikan koneksi stabil sebelum mengunduh.`;
}

export function tplOrderRejected(p: { buyerName: string; orderCode: string; reason: string }) {
  return `Halo ${p.buyerName},

Maaf, bukti transfer untuk order ${p.orderCode} DITOLAK dengan alasan:
${p.reason}

Kamu bisa mengunggah bukti baru dari halaman order sebelum batas waktu kedaluwarsa.`;
}

export function tplSellerNewOrder(p: { sellerName: string; orderCode: string; productTitle: string; price: number }) {
  return `Halo ${p.sellerName},

Order baru masuk ke tokomu: ${p.orderCode}
Produk: ${p.productTitle}
Nominal: Rp${p.price.toLocaleString("id-ID")}

${p.price > 0 ? "Pantau verifikasi dari dashboard seller." : ""}`;
}

export function tplOrderCancelled(p: { buyerName: string; orderCode: string; reason: string }) {
  return `Halo ${p.buyerName},

Order ${p.orderCode} telah dibatalkan. Alasan: ${p.reason}
Kamu bebas membuat order baru kapan saja.`;
}

export function tplOrderExpired(p: { buyerName: string; orderCode: string }) {
  return `Halo ${p.buyerName},

Order ${p.orderCode} kedaluwarsa karena tidak ada progres pembayaran dalam 24 jam.
Kamu bisa melakukan order ulang kapan saja dari halaman produk.`;
}

export function tplManualNoResponse(p: { buyerName: string; orderCode: string }) {
  return `Halo ${p.buyerName},

Order ${p.orderCode} dibatalkan otomatis karena tidak mendapat respons manual dari seller dalam 24 jam.
Kamu boleh melakukan reorder - dan jika berulang, laporkan tokonya ke kami.`;
}

export function tplInvoiceIssued(p: { sellerName: string; invoiceCode: string; amount: number; dueDate: string; payNote: string }) {
  return `Halo ${p.sellerName},

Invoice komisi ${p.invoiceCode} telah terbit:
Tunggakan: Rp${p.amount.toLocaleString("id-ID")}
Batas bayar sebelum suspend: ${p.dueDate}

${p.payNote}

Setelah membayar, kirim bukti ke tim Althentic untuk diverifikasi manual.`;
}

export function tplInvoiceReminder(p: { sellerName: string; invoiceCode: string; amount: number; suspendDate: string }) {
  return `Halo ${p.sellerName},

Pengingat: invoice komisi ${p.invoiceCode} sebesar Rp${p.amount.toLocaleString("id-ID")} belum lunas.
Tanggal suspend otomatis: ${p.suspendDate}.

Segera selesaikan pembayaran agar tokomu tetap aktif.`;
}

export function tplProductRejected(p: { sellerName: string; productTitle: string; reason: string }) {
  return `Halo ${p.sellerName},

Produk "${p.productTitle}" DITOLAK pada proses verifikasi.
Alasan: ${p.reason}

Kamu punya waktu 14 hari untuk "Perbaiki & Kirim Ulang" sebelum produk otomatis diarsipkan.`;
}

export function tplKeyRotationReminder(p: { sellerName: string }) {
  return `Halo ${p.sellerName},

API key AI Receipt Scanner tokomu telah gagal 3 kali berturut-turut.
Silakan buka Settings Toko → "Ganti key" agar verifikasi pembayaran kembali berjalan otomatis.`;
}

export function tplCommissionWarning(p: { sellerName: string; owed: number; threshold: number; percent: number }) {
  return `Halo ${p.sellerName},

Commission Owed tokomu sudah mencapai ${p.percent}% dari batas tunggakan (Rp${p.owed.toLocaleString("id-ID")} dari Rp${p.threshold.toLocaleString("id-ID")}).
Jika melewati batas, toko akan otomatis suspend.`;
}

export function tplSuspended(p: { sellerName: string; reason: string }) {
  return `Halo ${p.sellerName},

Tokomu telah di-SUSPEND. Alasan: ${p.reason}
Produk disembunyikan dari katalog. Order Lunas tetap bisa diakses pembeli.
Hubungi tim Althentic untuk penyelesaian.`;
}

export function tplCriticalAlert(p: { message: string }) {
  return `ALERT KRITIS Althentic.Dev:

${p.message}

Periksa Vercel Logs dan halaman Status segera.`;
}
