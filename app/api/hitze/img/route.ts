import { NextRequest, NextResponse } from "next/server";

// Reicht das gerenderte Landsat-Hitze-PNG des Backends an den Browser durch.
export const maxDuration = 20;
const BACKEND = process.env.HITZE_BACKEND ?? "http://91.98.150.71:8087";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? "";
  if (!/^[-0-9._]+$/.test(key)) return NextResponse.json({ error: "invalid_key" }, { status: 400 });
  try {
    const res = await fetch(`${BACKEND}/heat/img/${key}.png`, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}
