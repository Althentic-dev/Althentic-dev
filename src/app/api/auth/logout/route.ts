// POST /api/auth/logout — turunkan session manual (SPEC-05-07)
import { handle, json } from "@/lib/server/helpers";
import { destroyCurrentSession } from "@/lib/server/auth";

export async function POST() {
  return handle(async () => {
    await destroyCurrentSession();
    return json({ ok: true });
  });
}
