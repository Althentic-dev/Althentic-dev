// POST /api/webhooks/github-release - sync changelog dari GitHub Release (Docs §7).
// Signature wajib diverifikasi; konfigurasi secret kosong ditolak.
import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { json, fail, handle, readJsonBodyLimited } from "@/lib/server/helpers";
import { getServerSecret } from "@/lib/server/secrets";

const MAX_WEBHOOK_BYTES = 1024 * 1024;

function verifySignature(payload: string, signature: string | null): boolean {
  const secret = getServerSecret("GITHUB_WEBHOOK_SECRET", "dev-github-webhook-secret");
  if (!signature?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.slice(7));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const parsedBody = await readJsonBodyLimited(req, MAX_WEBHOOK_BYTES);
    if (!parsedBody.ok) {
      if (parsedBody.reason === "too_large") return fail("Payload webhook melebihi batas 1 MB.", 413);
      return fail("Payload JSON webhook tidak valid.", 400);
    }
    const raw = parsedBody.text;
    if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
      return fail("Signature webhook tidak valid.", 401);
    }
    const event = req.headers.get("x-github-event");
    if (event !== "release") return json({ ok: true, ignored: event });
    if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
      return fail("Payload release harus berupa object JSON.", 400);
    }

    const body = parsedBody.value as {
      action?: string;
      release?: {
        tag_name?: string;
        name?: string;
        body?: string;
        published_at?: string;
        html_url?: string;
      };
    };
    const release = body.release;
    if (!release?.tag_name) return fail("Payload release tidak valid.", 422);

    const existing = await db.changelogEntry.findFirst({
      where: { tagName: release.tag_name },
    });
    const data = {
      tagName: release.tag_name,
      name: release.name ?? release.tag_name,
      body: release.body ?? "",
      publishedAt: new Date(release.published_at ?? Date.now()),
      url: release.html_url ?? null,
      source: "github",
    };
    if (existing) {
      await db.changelogEntry.update({ where: { id: existing.id }, data });
    } else {
      await db.changelogEntry.create({ data });
    }
    return json({ ok: true, synced: release.tag_name });
  });
}

// GET - daftar changelog kronologis (dipakai halaman dokumentasi)
export async function GET() {
  return handle(async () => {
    const entries = await db.changelogEntry.findMany({
      orderBy: { publishedAt: "desc" },
    });
    return json({
      entries: entries.map((e) => ({
        id: e.id,
        tagName: e.tagName,
        name: e.name,
        body: e.body,
        publishedAt: e.publishedAt.toISOString(),
        url: e.url,
      })),
    });
  });
}
