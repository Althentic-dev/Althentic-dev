// GET /api/admin/misc?what=emails|mcp|reports — log email, token MCP, laporan abuse
// POST — aksi: mcp-issue (token 24 jam GAP-19), mcp-revoke, run-maintenance (cron manual)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, handle, fail } from "@/lib/server/helpers";
import { requireSuperAdmin } from "@/lib/server/auth";
import { issueMcpToken, revokeMcpToken } from "@/lib/server/mcp";
import { runMaintenance } from "@/lib/server/cron";

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireSuperAdmin(req);
    const what = req.nextUrl.searchParams.get("what") || "emails";
    if (what === "emails") {
      const emails = await db.emailOutbox.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return json({
        emails: emails.map((e) => ({
          id: e.id,
          toEmail: e.toEmail,
          subject: e.subject,
          body: e.body,
          kind: e.kind,
          status: e.status,
          createdAt: e.createdAt.toISOString(),
        })),
      });
    }
    if (what === "mcp") {
      const tokens = await db.mcpToken.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return json({
        tokens: tokens.map((t) => ({
          id: t.id,
          note: t.note,
          expiresAt: t.expiresAt.toISOString(),
          revokedAt: t.revokedAt?.toISOString() ?? null,
          createdAt: t.createdAt.toISOString(),
        })),
        endpoint: "/api/mcp",
      });
    }
    if (what === "reports") {
      const reports = await db.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { product: { select: { title: true, slug: true } } },
      });
      return json({
        reports: reports.map((r) => ({
          id: r.id,
          category: r.category,
          detail: r.detail,
          status: r.status,
          productTitle: r.product.title,
          productSlug: r.product.slug,
          createdAt: r.createdAt.toISOString(),
        })),
      });
    }
    return fail("Query tidak dikenal.", 400);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const admin = await requireSuperAdmin(req);
    const body = (await req.json().catch(() => null)) as {
      action?: string;
      note?: string;
      tokenId?: string;
    } | null;
    if (body?.action === "mcp-issue") {
      const token = await issueMcpToken(admin.id, body.note);
      return json({ token }); // hanya ditampilkan sekali (expire 24 jam — GAP-19)
    }
    if (body?.action === "mcp-revoke" && body.tokenId) {
      await revokeMcpToken(body.tokenId);
      return json({ ok: true });
    }
    if (body?.action === "run-maintenance") {
      const report = await runMaintenance();
      return json({ ok: true, report });
    }
    return fail("Aksi tidak dikenal.", 400);
  });
}
