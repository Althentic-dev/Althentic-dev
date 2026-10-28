// GET /api/auth/me — session aktif (dipanggil di dalam route, SPEC-15-04)
import { handle, json } from "@/lib/server/helpers";
import { getSessionUser } from "@/lib/server/auth";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await getSessionUser(req);
    return json({ user });
  });
}
