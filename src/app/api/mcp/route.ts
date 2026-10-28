// POST /api/mcp — MCP Server (Streamable HTTP, SPEC-08-04/05, GAP-19)
// Secret token per-session dari dashboard Super-Admin (expire 24 jam) atau
// master MCP_SECRET dari environment. Setiap panggilan tercatat di audit log.
// Tools: list_pending / get_product / get_inspection / propose_decision
// (AI HANYA mengusulkan; eksekusi final = satu klik Super-Admin).
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json, fail, handle } from "@/lib/server/helpers";
import { verifyMcpToken, logMcpCall, recordAiProposal } from "@/lib/server/mcp";

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: number | string;
  method?: string;
  params?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    // Otorisasi: Authorization Bearer / header x-mcp-token (SPEC-08-04)
    const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? req.headers.get("x-mcp-token") ?? "";
    if (!auth || !(await verifyMcpToken(auth))) {
      return fail("Unauthorized: MCP secret token tidak valid atau kedaluwarsa.", 401);
    }

    const body = (await req.json().catch(() => null)) as JsonRpcRequest | null;
    if (!body?.method) return fail("JSON-RPC method wajib.", 400);
    const id = body.id ?? null;

    // --- initialize (Streamable HTTP handshake) ---
    if (body.method === "initialize") {
      await logMcpCall({ action: "initialize", payload: {} });
      return json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2025-03-26",
          serverInfo: { name: "althentic-mcp", version: "1.0.0" },
          capabilities: { tools: {} },
        },
      });
    }

    // --- tools/list ---
    if (body.method === "tools/list") {
      await logMcpCall({ action: "tools/list", payload: {} });
      return json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: [
            {
              name: "list_pending_verifications",
              description: "Daftar produk menunggu verifikasi beserta ringkasan laporan inspeksi.",
              inputSchema: { type: "object", properties: {} },
            },
            {
              name: "get_inspection_report",
              description: "Laporan inspeksi Markdown lengkap untuk satu produk.",
              inputSchema: { type: "object", properties: { productId: { type: "string" } }, required: ["productId"] },
            },
            {
              name: "propose_decision",
              description:
                "Usulkan keputusan approve/reject beserta alasan. Hanya USULAN — eksekusi final menunggu konfirmasi Super-Admin (SPEC-08-05).",
              inputSchema: {
                type: "object",
                properties: {
                  productId: { type: "string" },
                  proposal: { type: "string", enum: ["approve", "reject"] },
                  reason: { type: "string" },
                },
                required: ["productId", "proposal", "reason"],
              },
            },
          ],
        },
      });
    }

    // --- tools/call ---
    if (body.method === "tools/call") {
      const name = (body.params?.name as string) ?? "";
      const args = (body.params?.arguments ?? {}) as Record<string, unknown>;
      await logMcpCall({ action: `call:${name}`, payload: args });

      if (name === "list_pending_verifications") {
        const items = await db.product.findMany({
          where: { status: "pending_verification" },
          include: { store: { select: { name: true } }, inspections: { orderBy: { createdAt: "desc" }, take: 1 } },
        });
        return json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  items.map((p) => ({
                    productId: p.id,
                    title: p.title,
                    category: p.category,
                    store: p.store.name,
                    driveStatus: p.inspections[0]?.driveStatus ?? "-",
                    demoHttpStatus: p.inspections[0]?.demoHttpStatus ?? null,
                  }))
                ),
              },
            ],
          },
        });
      }

      if (name === "get_inspection_report") {
        const productId = String(args.productId ?? "");
        const report = await db.inspectionReport.findFirst({
          where: { productId },
          orderBy: { createdAt: "desc" },
        });
        if (!report) return fail("Laporan inspeksi tidak ditemukan.", 404);
        return json({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: report.markdown }] },
        });
      }

      if (name === "propose_decision") {
        const productId = String(args.productId ?? "");
        const proposal = String(args.proposal ?? "");
        const reason = String(args.reason ?? "");
        if (!["approve", "reject"].includes(proposal) || !reason) {
          return fail("Usulan tidak valid (approve/reject + alasan).", 422);
        }
        const product = await db.product.findUnique({ where: { id: productId } });
        if (!product) return fail("Produk tidak ditemukan.", 404);
        await recordAiProposal({ productId, proposal: proposal as "approve" | "reject", reason });
        return json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: `Usulan ${proposal} tercatat di audit trail. Menunggu satu klik konfirmasi Super-Admin untuk eksekusi final.`,
              },
            ],
          },
        });
      }
      return fail(`Tool tidak dikenal: ${name}`, 400);
    }

    return fail(`Method tidak dikenal: ${body.method}`, 400);
  });
}

// GET — health/identify endpoint MCP (tanpa akses data)
export async function GET() {
  return json({
    server: "althentic-mcp",
    transport: "streamable-http",
    auth: "secret-token",
    note: "Endpoint internal Super-Admin — tidak didaftarkan di direktori MCP publik (GAP-19).",
  });
}
