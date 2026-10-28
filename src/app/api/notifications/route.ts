// GET /api/notifications — daftar notifikasi user (SPEC-13-02)
import { handle, json } from "@/lib/server/helpers";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return json({ notifications });
  });
}

// POST /api/notifications/read-all
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    await db.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return json({ ok: true });
  });
}
