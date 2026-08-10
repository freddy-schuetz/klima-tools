import { NextRequest, NextResponse } from "next/server";

// „Wollt ihr das für eure Destination?" aus dem Demo-Report heraus.
//
// Bewusst NICHT auf /api/klimafit/anfrage gelegt: Die Route startet den
// Freischaltungs-Workflow und erwartet einen amtlichen Gemeindeschlüssel. Wer
// dieses Feld benutzt, hat genau den nicht — sonst bräuchte er es nicht. Hier
// entsteht deshalb kein Report, sondern eine Rückmeldung.
//
// Das Secret bleibt serverseitig, gleiche Bauart wie /api/klimafit/report.
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const base = process.env.KLIMAFIT_BACKEND;
  const secret = process.env.N8N_KLIMA_SECRET;
  if (!base || !secret) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  let eingabe: Record<string, unknown>;
  try {
    eingabe = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const text = (wert: unknown, max: number) =>
    typeof wert === "string" ? wert.trim().slice(0, max) : "";
  const destination = text(eingabe.destination, 160);
  const mail = text(eingabe.mail, 160);
  if (destination.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const res = await fetch(`${base}/interesse`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-klima-secret": secret },
      body: JSON.stringify({
        destination,
        mail,
        name: text(eingabe.name, 160) || null,
        nachricht: text(eingabe.nachricht, 2000) || null,
        quelle: text(eingabe.quelle, 64) || null,
      }),
      signal: AbortSignal.timeout(25_000),
    });
    const daten = await res.json().catch(() => ({ error: "upstream_error" }));
    return NextResponse.json(daten, { status: res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}
