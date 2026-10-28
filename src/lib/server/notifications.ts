// Althentic.Dev — Notifikasi in-app (SPEC-13-02) + helper kirim email aman

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/server/email";
import { fileUrl } from "@/lib/server/storage";

export async function notifyUser(p: {
  userId: string;
  type: string; // order_update | verification_result | invoice | product_update | system
  title: string;
  body: string;
  linkQuery?: string;
  email?: { to: string; subject: string; body: string; kind: string } | null;
}) {
  await db.notification.create({
    data: {
      userId: p.userId,
      type: p.type,
      title: p.title,
      body: p.body,
      linkQuery: p.linkQuery ?? null,
    },
  });
  if (p.email) {
    await sendEmail({
      to: p.email.to,
      subject: p.email.subject,
      body: p.email.body,
      kind: p.email.kind,
    });
  }
}

/** URL objek gambar dari storage — helper DTO mapper. */
export function publicFileUrl(p?: string | null): string | null {
  if (!p) return null;
  const [bucket, ...rest] = p.split("/");
  if (bucket !== "public") return null;
  return fileUrl("public", rest.join("/"));
}

export function signedFileUrl(p?: string | null): string | null {
  if (!p) return null;
  const [bucket, ...rest] = p.split("/");
  return fileUrl(bucket === "private" ? "private" : "public", rest.join("/"));
}
