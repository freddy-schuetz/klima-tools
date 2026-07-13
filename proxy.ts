import { NextRequest, NextResponse } from "next/server";

// Host → Tool-Pfad. Jede Subdomain zeigt auf dieselbe Vercel-App;
// lokal (localhost) funktionieren die Pfade /<tool> direkt.
// Next 16: "proxy" ist die Nachfolge-Konvention von "middleware".
const HOSTS: Record<string, string> = {
  // Welle 1 — Wasser & Wald (live)
  "pegel-ampel.friedemann-schuetz.de": "/pegel-ampel",
  "waldbrand-radar.friedemann-schuetz.de": "/waldbrand-radar",
  // Welle 2 — Klima-Checks (live)
  "klimafit-check.friedemann-schuetz.de": "/klimafit-check",
  "solar-vorabcheck.friedemann-schuetz.de": "/solar-vorabcheck",
  // Welle 3 — Energie & Kommune
  "gruenstrom-ampel.friedemann-schuetz.de": "/gruenstrom-ampel",
  "hitze-briefing.friedemann-schuetz.de": "/",
  // Welle 4 — Natur & Agrar (bis zum Launch → Landing)
  "saison-radar.friedemann-schuetz.de": "/",
  "frost-warndienst.friedemann-schuetz.de": "/",
};

export default function proxy(req: NextRequest) {
  const host = req.headers.get("host")?.toLowerCase().split(":")[0] ?? "";
  const prefix = HOSTS[host];
  if (!prefix) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith(prefix)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = pathname === "/" ? prefix : `${prefix}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
