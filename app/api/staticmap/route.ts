import { NextRequest, NextResponse } from "next/server";

// Öffentlicher HTTPS-Proxy für die statischen Karten-Bilder der E-Mails.
// Kein Secret: E-Mail-Clients (Gmail-Proxy, Apple Mail) laden das <img> ohne Header.
// Liefert nur ein gerendertes OSM-Kartenbild (keine sensiblen Daten). Stark gecacht.
export const maxDuration = 25;
const BACKEND = process.env.HITZE_BACKEND ?? "http://91.98.150.71:8087";

export async function GET(req: NextRequest) {
  const markers = req.nextUrl.searchParams.get("markers") ?? "";
  const w = req.nextUrl.searchParams.get("w") ?? "600";
  const h = req.nextUrl.searchParams.get("h") ?? "300";
  // Allowlist: nur Zahlen, Komma, Semikolon, Buchstaben (Farbnamen)
  if (!/^[0-9a-zäöü.,;-]+$/i.test(markers) || markers.length > 2000 || !/^\d{2,3}$/.test(w) || !/^\d{2,3}$/.test(h)) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }
  try {
    const res = await fetch(`${BACKEND}/staticmap?markers=${encodeURIComponent(markers)}&w=${w}&h=${h}`, {
      signal: AbortSignal.timeout(20_000),
      next: { revalidate: 1800 },
    });
    if (!res.ok) return NextResponse.json({ error: "render_failed" }, { status: res.status });
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=1800, s-maxage=3600" },
    });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}
