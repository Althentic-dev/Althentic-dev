// GET  /api/admin/invoices — daftar invoice komisi semua toko
// POST — verifikasi pembayaran komisi manual TANPA AI (SPEC-09-06, GAP-16)
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { requireSuperAdmin } from "@/lib/server/auth";
import { verifyInvoicePayment } from "@/lib/server/commission";
import type { InvoiceDTO } from "@/lib/types";

export async function GET(req: Request) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const invoices = await db.invoice.findMany({
      orderBy: { issuedAt: "desc" },
      include: { store: { select: { id: true, name: true, slug: true } }, entries: { select: { id: true } } },
    });
    const dtos: InvoiceDTO[] = invoices.map((i) => ({
      id: i.id,
      code: i.code,
      amount: i.amount,
      status: i.status,
      issuedAt: i.issuedAt.toISOString(),
      dueAt: i.dueAt.toISOString(),
      suspendAt: i.suspendAt.toISOString(),
      paidAt: i.paidAt?.toISOString() ?? null,
      paidAmount: i.paidAmount ?? null,
      paidMethod: i.paidMethod ?? null,
      paidReference: i.paidReference ?? null,
      entryCount: i.entries.length,
      store: i.store,
    }));
    return json({ invoices: dtos });
  });
}

// Form verifikasi (SPEC-09-06): pilih invoice, nominal diterima, tanggal bayar,
// metode (transfer/e-wallet), referensi opsional
const schema = z.object({
  invoiceId: z.string().min(1),
  paidAmount: z.number().int().min(0),
  paidAt: z.string().datetime().or(z.string().min(8)),
  paidMethod: z.enum(["transfer", "ewallet"]),
  paidReference: z.string().max(100).optional(),
  paidNote: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  return handle(async () => {
    const admin = await requireSuperAdmin(req);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak valid.", 422);
    const result = await verifyInvoicePayment({
      invoiceId: parsed.data.invoiceId,
      superAdminId: admin.id,
      paidAmount: parsed.data.paidAmount,
      paidAt: new Date(parsed.data.paidAt),
      paidMethod: parsed.data.paidMethod,
      paidReference: parsed.data.paidReference,
      paidNote: parsed.data.paidNote,
    });
    return json(result);
  });
}
