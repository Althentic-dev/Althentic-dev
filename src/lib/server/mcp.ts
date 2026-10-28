// =============================================================================
// Althentic.Dev — MCP (SPEC-08-04/05, GAP-19)
// Streamable HTTP endpoint /api/mcp dengan secret token per-session dari
// dashboard Super-Admin, expire 24 jam, tidak didaftarkan di direktori publik.
// AI hanya boleh MEMBACA laporan inspeksi & data produk lalu MENGUSULKAN
// keputusan — eksekusi final tetap satu klik Super-Admin.
// =============================================================================

import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

const MCP_SECRET = process.env.MCP_SECRET || "dev-mcp-secret";

export async function issueMcpToken(createdBy: string, note?: string) {
  const token = `mcp_${randomBytes(24).toString("hex")}`;
  const tokenHash = createHash("sha256").update(token + MCP_SECRET).digest("hex");
  await db.mcpToken.create({
    data: {
      tokenHash,
      createdBy,
      note: note ?? null,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000), // expire 24 jam (GAP-19)
    },
  });
  return token; // hanya ditampilkan sekali saat dibuat
}

export async function verifyMcpToken(token: string): Promise<boolean> {
  if (!token) return false;
  // Dukung juga master secret dari environment (untuk klien tetap)
  if (token === MCP_SECRET) return true;
  const tokenHash = createHash("sha256").update(token + MCP_SECRET).digest("hex");
  const row = await db.mcpToken.findUnique({ where: { tokenHash } });
  if (!row) return false;
  if (row.revokedAt) return false;
  if (row.expiresAt < new Date()) return false;
  return true;
}

export async function revokeMcpToken(id: string) {
  await db.mcpToken.update({ where: { id }, data: { revokedAt: new Date() } });
}

export async function logMcpCall(p: {
  action: string;
  payload: unknown;
  result?: unknown;
}) {
  await db.auditLog.create({
    data: {
      actorType: "ai",
      action: `mcp:${p.action}`,
      payloadJson: JSON.stringify(p.payload).slice(0, 2000),
      reason: p.result ? JSON.stringify(p.result).slice(0, 500) : null,
    },
  });
}

/** AI mengusulkan keputusan (tidak mengeksekusi) — SPEC-08-05. */
export async function recordAiProposal(p: {
  productId: string;
  proposal: "approve" | "reject";
  reason: string;
}) {
  await db.auditLog.create({
    data: {
      actorType: "ai",
      action: "ai_propose",
      productId: p.productId,
      payloadJson: JSON.stringify({ proposal: p.proposal }),
      decision: `proposed:${p.proposal}`,
      reason: p.reason,
    },
  });
}
