// GET /api/admin/verifications — list verifikasi produk: tabel + filter + search
// + audit trail (Konteks Terkunci; tab "Riwayat Verifikasi" = audit feed)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, handle } from "@/lib/server/helpers";
import { requireSuperAdmin } from "@/lib/server/auth";
import type { VerificationItemDTO, AuditEntryDTO } from "@/lib/types";

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const sp = req.nextUrl.searchParams;
    const filter = sp.get("filter") || "pending"; // pending | rejected | active | all
    const q = (sp.get("q") || "").trim();

    const where: Record<string, unknown> = {};
    if (filter === "pending") where.status = "pending_verification";
    else if (filter === "rejected") where.status = "rejected";
    else if (filter === "active") where.status = "active";
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { store: { name: { contains: q } } },
        { store: { slug: { contains: q } } },
      ];
    }

    const products = await db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        store: { select: { name: true, slug: true } },
        inspections: { orderBy: { createdAt: "desc" }, take: 1 },
        auditLogs: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    const items: VerificationItemDTO[] = products.map((p) => ({
      productId: p.id,
      title: p.title,
      slug: p.slug,
      storeName: p.store.name,
      storeSlug: p.store.slug,
      category: p.category,
      status: p.status,
      submittedAt: p.updatedAt.toISOString(),
      rejectedReason: p.rejectedReason,
      latestInspection: p.inspections[0]
        ? {
            id: p.inspections[0].id,
            markdown: p.inspections[0].markdown,
            driveStatus: p.inspections[0].driveStatus,
            demoHttpStatus: p.inspections[0].demoHttpStatus,
            zipSize: p.inspections[0].zipSize,
            createdAt: p.inspections[0].createdAt.toISOString(),
            trigger: p.inspections[0].trigger,
          }
        : null,
      audits: p.auditLogs.map(
        (a): AuditEntryDTO => ({
          id: a.id,
          actorType: a.actorType,
          action: a.action,
          decision: a.decision,
          reason: a.reason,
          payloadJson: a.payloadJson,
          createdAt: a.createdAt.toISOString(),
          productTitle: p.title,
        })
      ),
    }));

    // Tab Riwayat Verifikasi: audit trail global (terbaru dulu)
    const auditFeed = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { product: { select: { title: true, slug: true } } },
    });
    const auditTrail: AuditEntryDTO[] = auditFeed.map((a) => ({
      id: a.id,
      actorType: a.actorType,
      action: a.action,
      decision: a.decision,
      reason: a.reason,
      payloadJson: a.payloadJson,
      createdAt: a.createdAt.toISOString(),
      productTitle: a.product?.title ?? "-",
    }));

    return json({ items, auditTrail });
  });
}
