import { NextResponse } from "next/server";

export const maxDuration = 30;
export const revalidate = 900;

export async function GET() {
  const base = process.env.N8N_BASE;
  const secret = process.env.N8N_KLIMA_SECRET;
  if (!base || !secret) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }
  try {
    const res = await fetch(`${base}/webhook/klima-gruenstrom-status`, {
      headers: { "x-klima-secret": secret },
      signal: AbortSignal.timeout(25_000),
      next: { revalidate: 900 },
    });
    const data = await res.json().catch(() => ({ error: "upstream_error" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}
