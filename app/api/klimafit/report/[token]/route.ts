import { NextRequest, NextResponse } from "next/server";

// Server-Proxy zum Tiefen-Report-Backend (brain-VPS hinter Caddy).
// Das Secret bleibt serverseitig — dieselbe Bauart wie /api/hitze.
export const maxDuration = 30;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const base = process.env.KLIMAFIT_BACKEND;
  const secret = process.env.N8N_KLIMA_SECRET;
  if (!base || !secret) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  try {
    const res = await fetch(`${base}/report/${token}`, {
      headers: { "x-klima-secret": secret },
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({ error: "upstream_error" }));
    return NextResponse.json(data, { status: res.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}
