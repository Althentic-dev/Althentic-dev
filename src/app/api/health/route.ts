import { NextResponse } from "next/server";
import { GET as getSystemStatus } from "../status/route";

export const dynamic = "force-dynamic";

export async function GET() {
  const statusResponse = await getSystemStatus();

  if (statusResponse.status >= 500) return statusResponse;

  const status = (await statusResponse.clone().json().catch(() => null)) as {
    overall?: unknown;
  } | null;

  if (!status || typeof status !== "object" || !("overall" in status)) {
    return NextResponse.json(
      { overall: "degraded", note: "Status dependency tidak dapat diverifikasi." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(status, {
    status: status.overall === "operational" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
