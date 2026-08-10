/**
 * „Und für unsere Destination?" — das Feld, das aus einem gelesenen Demo-Report
 * eine Anfrage macht.
 *
 * Zwei Entscheidungen, die den Rest erklären:
 *
 * 1. FREITEXT statt Auswahlliste. Wer hier schreibt, ist gerade nicht im
 *    Datenbestand — sonst bräuchte er das Feld nicht. Eine Liste der fünf
 *    vorhandenen Destinationen wäre genau für niemanden hier gedacht.
 *
 * 2. NICHT IM DRUCK. Der Report wird als PDF verschickt und in Sitzungen
 *    weitergereicht. Ein Eingabefeld im PDF ist bestenfalls tot und
 *    schlimmstenfalls peinlich; `print:hidden` nimmt es aus dem Ausdruck und
 *    damit auch aus der PDF-Erzeugung, die mit Druck-Stylesheet rendert.
 */
"use client";

import { useState } from "react";

type Zustand = "offen" | "sendet" | "fertig" | "fehler";

export default function EigeneDestination({ quelle }: { quelle?: string }) {
  const [destination, setDestination] = useState("");
  const [mail, setMail] = useState("");
  const [name, setName] = useState("");
  const [zustand, setZustand] = useState<Zustand>("offen");
  const [meldung, setMeldung] = useState<string | null>(null);

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setZustand("sendet");
    setMeldung(null);
    try {
      const res = await fetch("/api/klimafit/interesse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, mail, name, quelle }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setZustand("fertig");
    } catch {
      setZustand("fehler");
      setMeldung(
        "Das Absenden hat nicht geklappt. Schreiben Sie mir gern direkt an f.schuetz@posteo.de.",
      );
    }
  }

  if (zustand === "fertig") {
    return (
      <section className="mb-8 rounded-2xl bg-brand/5 p-5 ring-1 ring-brand/20 print:hidden">
        <p className="text-sm leading-relaxed text-slate-800">
          <strong className="text-brand">Notiert.</strong> Ich melde mich bei Ihnen und sage vorab,
          welche Daten für <strong>{destination}</strong> vorliegen und was davon belastbar ist —
          bevor irgendetwas gerechnet wird.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 print:hidden">
      <h2 className="text-base font-semibold text-brand">Und für Ihre Destination?</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
        Dieser Bericht ist ein Beispiel. Wenn Sie wissen wollen, wie er für Ihren Landkreis
        aussähe: Name eintragen, ich sehe nach, welche Daten dafür vorliegen, und melde mich.
      </p>

      <form onSubmit={absenden} className="mt-4 grid gap-3 sm:grid-cols-[1.3fr_1fr_1.2fr_auto]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Destination oder Landkreis
          </span>
          <input
            required
            minLength={2}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="z. B. Nordseeheilbad Cuxhaven"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Ihr Name <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">E-Mail</span>
          <input
            required
            type="email"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            placeholder="name@destination.de"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={zustand === "sendet"}
            className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {zustand === "sendet" ? "Wird gesendet …" : "Anfragen"}
          </button>
        </div>
      </form>

      {meldung && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {meldung}
        </p>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Es wird nichts automatisch gerechnet und nichts berechnet. Ihre Angaben nutze ich
        ausschließlich, um Ihnen zu antworten.
      </p>
    </section>
  );
}
