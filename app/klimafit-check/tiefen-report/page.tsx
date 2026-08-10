"use client";

import { useState } from "react";
import AboutSection from "@/components/AboutSection";
import EigeneDestination from "@/components/report/EigeneDestination";

// Profil-Formular für den Tiefen-Report.
//
// Zwei Minuten Aufwand, drei Dinge Wirkung: Die Angebots-Schwerpunkte steuern,
// welche Segmentkapitel Sie bekommen (ein Schneekapitel für eine Küste wäre
// Unsinn), die wichtigsten Monate gewichten die Verschneidung, und der
// Verwendungszweck bestimmt Tonalität und Schlusskapitel.

const DESTINATIONEN = [
  { ags: "05958048", name: "Winterberg", zusatz: "Hochsauerlandkreis · Mittelgebirge" },
  { ags: "01054113", name: "Sankt Peter-Ording", zusatz: "Nordfriesland · Küste" },
  { ags: "09180117", name: "Garmisch-Partenkirchen", zusatz: "Oberbayern · Alpen" },
  { ags: "01003000", name: "Lübeck", zusatz: "Kreisfreie Stadt · Stadt mit Küste" },
  // Ein ganzes Bundesland: zweistelliger Schluessel statt achtstelliger
  // Gemeinde. Der Report rechnet dafuer den Median ueber die 18 Landkreise.
  { ags: "12", name: "Brandenburg", zusatz: "ganzes Bundesland · Flachland" },
];

const SCHWERPUNKTE = [
  { key: "winter", label: "Wintersport" },
  { key: "wander", label: "Wandern & Rad" },
  { key: "bade", label: "Baden & Strand" },
  { key: "stadt", label: "Städte & Kultur" },
  { key: "kultur", label: "Veranstaltungen" },
  { key: "aktiv", label: "Aktiv & Outdoor" },
];

const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

const ZWECKE = [
  { key: "gremienvorlage", label: "Gremienvorlage", hilfe: "Aufsichtsrat, Stadtrat, Verbandsversammlung" },
  { key: "foerderantrag", label: "Förderantrag", hilfe: "Betroffenheitsnachweis in antragstauglicher Form" },
  { key: "strategie", label: "Strategieprozess", hilfe: "Faktenbasis für Beteiligung und Leitbildarbeit" },
];

export default function TiefenReportFormular() {
  const [ags, setAgs] = useState(DESTINATIONEN[0].ags);
  const [schwerpunkte, setSchwerpunkte] = useState<string[]>(["wander"]);
  const [monate, setMonate] = useState<number[]>([]);
  const [zweck, setZweck] = useState("strategie");
  const [empfaenger, setEmpfaenger] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"offen" | "laeuft" | "fertig" | "fehler">("offen");
  const [meldung, setMeldung] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  function umschalten<T>(liste: T[], wert: T, setzen: (l: T[]) => void) {
    setzen(liste.includes(wert) ? liste.filter((x) => x !== wert) : [...liste, wert]);
  }

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setStatus("laeuft");
    setMeldung(null);
    try {
      const res = await fetch("/api/klimafit/anfrage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ags,
          empfaenger,
          name,
          profil: { schwerpunkte, wichtige_monate: monate, zweck },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error || "start_failed");
      setReportUrl(data.url ?? `/klimafit-check/report/${data.token}`);
      setStatus("fertig");
    } catch (fehler) {
      setStatus("fehler");
      // „Bitte später erneut versuchen" ist bei einem abgelehnten Eingabewert
      // der falsche Rat: Später ist es genauso abgelehnt. Wenn der Dienst sagt,
      // WAS ihm nicht passt, steht das hier — sonst bleibt es beim Hinweis auf
      // den zweiten Versuch, der bei einer Störung tatsächlich hilft.
      const grund = fehler instanceof Error ? fehler.message : "";
      const abgewiesen = grund && grund !== "start_failed" && !grund.startsWith("upstream");
      setMeldung(
        abgewiesen
          ? `Die Anfrage wurde abgelehnt: ${grund}. Schreiben Sie mir gern direkt an f.schuetz@posteo.de.`
          : "Die Anfrage konnte nicht übermittelt werden. Bitte später erneut versuchen.",
      );
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-accent">
          Destinations-Klimacheck · Stufe 2
        </p>
        <h1 className="mb-2 text-3xl font-bold text-brand">Tiefen-Report anfordern</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Zwei Minuten Angaben — daraus entsteht ein Report, der die Klimaprojektionen Ihres
          Landkreises mit Ihrer amtlichen Übernachtungs-Saisonkurve verschneidet und passende
          Handlungsoptionen ableitet.
        </p>
      </header>

      {/* Wer hier landet und seine Destination nicht in der Liste findet, hatte
          bisher keinen Weg weiter. Das Feld steht deshalb VOR dem Profil-
          Formular: Es beantwortet die Frage, die zuerst auftaucht. Als eigenes
          Element davor, nicht darin — verschachtelte Formulare sind ungültiges
          HTML und brechen das Absenden. */}
      <EigeneDestination quelle="Bestellseite" ort="auswahl" />

      {status === "fertig" ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-emerald-200">
          <h2 className="mb-2 text-lg font-semibold text-emerald-900">Ihr Report wird erstellt</h2>
          <p className="mb-4 text-sm leading-relaxed text-slate-700">
            Sobald er fertig ist, erreichen Sie ihn unter dem folgenden Link — und bekommen ihn
            zusätzlich per E-Mail. Der Link ist personalisiert; bitte nicht öffentlich teilen.
          </p>
          <a
            href={reportUrl ?? "#"}
            className="inline-block rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent"
          >
            Report öffnen
          </a>
        </div>
      ) : (
        <form onSubmit={absenden} className="space-y-6">
          <fieldset className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <legend className="px-1 text-sm font-semibold text-slate-900">Destination</legend>
            <div className="mt-2 space-y-2">
              {DESTINATIONEN.map((d) => (
                <label key={d.ags} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="ags"
                    value={d.ags}
                    checked={ags === d.ags}
                    onChange={(e) => setAgs(e.target.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{d.name}</span>
                    <span className="block text-xs text-slate-500">{d.zusatz}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Für diese fünf Destinationen liegen die Daten vollständig vor. Für Ihre eigene
              Destination bereiten wir sie auf Anfrage auf — die Klimadaten decken alle 401
              deutschen Landkreise ab, die Monatsdaten bislang Nordrhein-Westfalen, Bayern und
              Schleswig-Holstein.
            </p>
          </fieldset>

          <fieldset className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <legend className="px-1 text-sm font-semibold text-slate-900">
              Angebots-Schwerpunkte
            </legend>
            <p className="mb-3 mt-1 text-xs text-slate-500">
              Steuert, welche Segmentkapitel Sie bekommen. Mehrfachauswahl möglich.
            </p>
            <div className="flex flex-wrap gap-2">
              {SCHWERPUNKTE.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => umschalten(schwerpunkte, s.key, setSchwerpunkte)}
                  className={`rounded-full px-3 py-1.5 text-sm ring-1 transition ${
                    schwerpunkte.includes(s.key)
                      ? "bg-brand text-white ring-brand"
                      : "bg-white text-slate-700 ring-slate-300 hover:ring-brand-accent"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <legend className="px-1 text-sm font-semibold text-slate-900">
              Wirtschaftlich wichtigste Monate
            </legend>
            <p className="mb-3 mt-1 text-xs text-slate-500">
              Optional. Ohne Angabe verwenden wir Ihre amtliche Saisonkurve, die diese Monate
              ohnehin zeigt — Ihre Auswahl hilft dort, wo Ihre Erfahrung davon abweicht.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MONATE.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => umschalten(monate, i + 1, setMonate)}
                  className={`w-14 rounded-lg px-2 py-1.5 text-xs ring-1 transition ${
                    monate.includes(i + 1)
                      ? "bg-brand-accent text-white ring-brand-accent"
                      : "bg-white text-slate-700 ring-slate-300 hover:ring-brand-accent"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <legend className="px-1 text-sm font-semibold text-slate-900">
              Wofür brauchen Sie den Report?
            </legend>
            <div className="mt-2 space-y-2">
              {ZWECKE.map((z) => (
                <label key={z.key} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="zweck"
                    value={z.key}
                    checked={zweck === z.key}
                    onChange={(e) => setZweck(e.target.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{z.label}</span>
                    <span className="block text-xs text-slate-500">{z.hilfe}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <legend className="px-1 text-sm font-semibold text-slate-900">Kontakt</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">E-Mail für den Report-Link</span>
                <input
                  type="email"
                  required
                  value={empfaenger}
                  onChange={(e) => setEmpfaenger(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                />
              </label>
            </div>
          </fieldset>

          <div>
            <button
              type="submit"
              disabled={status === "laeuft" || !schwerpunkte.length}
              className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent disabled:opacity-50"
            >
              {status === "laeuft" ? "wird übermittelt …" : "Report anfordern"}
            </button>
            {meldung && <p className="mt-2 text-sm text-red-700">{meldung}</p>}
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Der Report ersetzt kein Klimaanpassungskonzept nach dem UBA-Leitfaden und keine
              Vollberatung. Er liefert die Daten- und Faktenbasis für Betroffenheitsanalyse und
              Gremienvorlage. Alle Szenarien sind Bandbreiten möglicher Entwicklungen, keine
              Vorhersagen.
            </p>
          </div>
        </form>
      )}

      <AboutSection mailSubject="Tiefen-Report Destinations-Klimacheck" />
    </main>
  );
}
