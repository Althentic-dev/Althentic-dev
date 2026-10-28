// GET/POST /api/cron/maintenance - Vercel Cron Jobs pattern (GAP-19).
// Auth: header Authorization Bearer CRON_SECRET atau sesi Super-Admin.
import { NextRequest } from "next/server";
import { json, fail, handle } from "@/lib/server/helpers";
import { getSessionUser } from "@/lib/server/auth";
import { runMaintenance } from "@/lib/server/cron";

async function authorized(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (secret && auth === secret) return true;
  const user = await getSessionUser(req);
  return !!user?.isSuperAdmin;
}

export async function GET(req: NextRequest) {
  return handle(async () => {
    if (!(await authorized(req))) return fail("Unauthorized", 401);
    const report = await runMaintenance();
    return json({ ok: true, report });
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    if (!(await authorized(req))) return fail("Unauthorized", 401);
    const report = await runMaintenance();
    return json({ ok: true, report });
  });
}
