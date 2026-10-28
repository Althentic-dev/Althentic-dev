// POST /api/generator/export — ekspor prompt generator (SPEC-12-05, GAP-15)
// Guest: 3x/hari/IP lalu diminta login. Login: ekspor penuh + history tersimpan.
// Skema JSON: { blocks, metadata:{generatedAt, version}, promptText }
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { json, fail, handle, getClientIp } from "@/lib/server/helpers";
import { getSessionUser } from "@/lib/server/auth";
import { GUEST_EXPORT_LIMIT } from "@/lib/constants";

const schema = z.object({
  format: z.enum(["markdown", "text", "json"]),
  title: z.string().max(120).optional(),
  blocks: z
    .array(z.object({ id: z.string(), type: z.string().min(1), content: z.string().max(4000) }))
    .min(1)
    .max(10),
});

function renderMarkdown(blocks: { type: string; content: string }[]): string {
  return blocks.map((b) => `## ${b.type}\n\n${b.content}`).join("\n\n");
}
function renderPlainText(blocks: { type: string; content: string }[]): string {
  return blocks.map((b) => `[${b.type}]\n${b.content}`).join("\n\n---\n\n");
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Input tidak valid.", 422);
    const user = await getSessionUser(req);
    const ip = getClientIp(req);

    // Batas guest: 3x export/hari/IP → diminta login (GAP-15)
    if (!user) {
      const day = new Date().toISOString().slice(0, 10);
      const count = await db.generatorExport.count({
        where: { ip, day },
      });
      if (count >= GUEST_EXPORT_LIMIT) {
        return fail(
          `Batas ekspor guest (${GUEST_EXPORT_LIMIT}x/hari) tercapai. Masuk untuk ekspor penuh + riwayat tersimpan.`,
          402,
          "GUEST_LIMIT"
        );
      }
      await db.generatorExport.create({ data: { ip, day } });
    }

    const { format, blocks, title } = parsed.data;
    const generatedAt = new Date().toISOString();
    const version = "1";

    let content = "";
    if (format === "markdown") {
      content = `# ${title || "Prompt Althentic"}\n\n${renderMarkdown(blocks)}`;
    } else if (format === "text") {
      content = renderPlainText(blocks);
    } else {
      // Skema JSON final (GAP-15)
      content = JSON.stringify(
        {
          blocks: blocks.map((b) => ({ type: b.type, content: b.content })),
          metadata: { generatedAt, version },
          promptText: renderPlainText(blocks),
        },
        null,
        2
      );
    }

    // History tersimpan hanya untuk user login (GAP-15)
    if (user) {
      await db.promptCanvas.create({
        data: {
          userId: user.id,
          title: title || "Prompt " + generatedAt.slice(0, 16),
          blocksJson: JSON.stringify(blocks),
          format,
        },
      });
    }

    return json({
      ok: true,
      format,
      content,
      saved: !!user,
      remainingGuestExports: user ? null : Math.max(0, GUEST_EXPORT_LIMIT - (await db.generatorExport.count({ where: { ip, day: new Date().toISOString().slice(0, 10) } })) - 1),
    });
  });
}

// GET — riwayat ekspor user login
export async function GET(req: Request) {
  return handle(async () => {
    const user = await getSessionUser(req);
    if (!user) return json({ canvases: [] });
    const canvases = await db.promptCanvas.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 30,
    });
    return json({
      canvases: canvases.map((c) => ({
        id: c.id,
        title: c.title,
        blocks: JSON.parse(c.blocksJson),
        format: c.format,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  });
}
