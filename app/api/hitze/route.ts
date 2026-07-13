import { NextRequest, NextResponse } from "next/server";

// Server-seitiger Proxy zum Hitze-Backend (FastAPI auf dograh-VPS, rasterio/Landsat).
// Das Backend ist nur mit x-klima-secret erreichbar und liefert öffentliche Umweltdaten.
export const maxDuration = 60;

const BACKEND = process.env.HITZE_BACKEND ?? "http://91.98.150.71:8087";

export async function GET(req: NextRequest) {
  const secret = process.env.N8N_KLIMA_SECRET;
  if (!secret) return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  const bbox = req.nextUrl.searchParams.get("bbox") ?? "";
  if (!/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/.test(bbox)) {
    return NextResponse.json({ error: "invalid_bbox" }, { status: 400 });
  }
  try {
    const res = await fetch(`${BACKEND}/briefing?bbox=${encodeURIComponent(bbox)}`, {
      headers: { "x-klima-secret": secret },
      signal: AbortSignal.timeout(55_000),
    });
    const data = await res.json().catch(() => ({ error: "upstream_error" }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}
