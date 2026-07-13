import { NextRequest, NextResponse } from "next/server";

// Server-seitiger Proxy zu Energy-Charts (Fraunhofer ISE, CC BY 4.0).
// Grund: Der n8n-Host erreicht das Fraunhofer-Netz nicht (Egress geblockt),
// Vercel schon — n8n holt die Daten daher über diese abgesicherte Route.
// Nur Allowlist-Pfade, nur mit x-klima-secret (kommt ausschliesslich aus n8n).
export const maxDuration = 30;

const ALLOWED = new Set(["ren_share_forecast", "price", "co2eq", "signal"]);

export async function GET(req: NextRequest) {
  const secret = process.env.N8N_KLIMA_SECRET;
  if (!secret || req.headers.get("x-klima-secret") !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const path = req.nextUrl.searchParams.get("path") ?? "";
  const query = req.nextUrl.searchParams.get("query") ?? "";
  if (!ALLOWED.has(path) || !/^[a-zA-Z0-9=&_.:-]*$/.test(query)) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }
  try {
    const res = await fetch(`https://api.energy-charts.info/${path}?${query}`, {
      headers: { "User-Agent": "klima-tools/0.1 (f.schuetz@posteo.de)" },
      signal: AbortSignal.timeout(25_000),
      next: { revalidate: 300 },
    });
    const data = await res.json().catch(() => ({ error: "upstream_error" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}
