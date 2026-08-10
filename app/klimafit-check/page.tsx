"use client";

import { useState } from "react";
import { usePolling } from "@/lib/usePolling";
import AmpelBadge from "@/components/AmpelBadge";
import DisclaimerBox from "@/components/DisclaimerBox";
import AboutSection from "@/components/AboutSection";
import { DESTINATIONEN, TYP_LABEL, TYP_REIHENFOLGE } from "@/lib/destinationen";

type SaisonP = { start_doy: number | null; ende_doy: number | null; laenge: number; laenge_min?: number; laenge_max?: number };
type Ziel = { med: number | null; min: number; max: number };
type Indikator = { key: string; heute: number; ziel: Ziel };
type Result = {
  ort: string;
  bundesland: string;
  dest_typ: string;
  perioden: { heute: string; ziel: string };
  modelle: string[];
  indikatoren: Indikator[];
  saison: { label: string; heute: SaisonP; ziel: SaisonP; delta_laenge_tage: number | null };
  handlungsfelder?: { titel: string; bezug: string; massnahmen: string[] }[];
  chancen?: string[];
  fazit?: string;
};

const IND_LABEL: Record<string, { label: string; hint: string; chance?: boolean }> = {
  hitzetage: { label: "Hitzetage", hint: "Tmax ≥ 30 °C" },
  sommertage: { label: "Sommertage", hint: "Tmax ≥ 25 °C" },
  tropennaechte: { label: "Tropennächte", hint: "Tmin ≥ 20 °C" },
  frosttage: { label: "Frosttage", hint: "Tmin < 0 °C" },
  eistage: { label: "Eistage", hint: "Tmax < 0 °C" },
  starkregentage: { label: "Starkregentage", hint: "≥ 20 mm/Tag" },
  wandertage: { label: "Aktivtage", hint: "15–28 °C, < 5 mm Regen", chance: true },
};

function doyToDate(doy: number | null) {
  if (doy == null) return "–";
  const d = new Date(2001, 0, doy);
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

// Saison-Balken: zeichnet die Saison als Segment(e). Winter läuft über den
// Jahreswechsel (Ende < Start) → zwei Segmente (Start→Jahresende, Jahresanfang→Ende).
function SeasonBar({ s, highlight }: { s: SaisonP; highlight: boolean }) {
  const color = highlight ? "bg-brand-accent" : "bg-slate-400";
  if (s.start_doy == null || s.ende_doy == null) return <div className="h-4 flex-1 rounded bg-slate-100" />;
  const segs: [number, number][] = s.ende_doy >= s.start_doy
    ? [[s.start_doy, s.ende_doy]]
    : [[s.start_doy, 365], [1, s.ende_doy]];
  return (
    <div className="relative h-4 flex-1 rounded bg-slate-100">
      {segs.map(([a, b], i) => (
        <div key={i} className={`absolute top-0 h-4 rounded ${color}`}
          style={{ left: `${(a / 366) * 100}%`, width: `${(Math.max(1, b - a) / 366) * 100}%` }}
          title={`${doyToDate(s.start_doy)} – ${doyToDate(s.ende_doy)}`} />
      ))}
    </div>
  );
}

export default function KlimacheckPage() {
  // Auswahl kodiert Typ und Ort, weil dieselbe Destination in mehreren Typen
  // vorliegen kann (Garmisch-Partenkirchen etwa als Wander- und als Winterziel).
  const [auswahl, setAuswahl] = useState(`${DESTINATIONEN[0].typ}|${DESTINATIONEN[0].ort}`);
  const [token, setToken] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const { status, result, errorMessage } = usePolling<Result>(token);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setStartError(null);
    setToken(null);
    const [typ, ort] = auswahl.split("|");
    const ziel = DESTINATIONEN.find((d) => d.typ === typ && d.ort === ort);
    if (!ziel) {
      setStartError("Unbekannte Destination.");
      return;
    }
    try {
      const res = await fetch("/api/klimacheck/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Koordinaten mitschicken: dann entfällt der Geocoding-Aufruf und der
        // Cache-Treffer ist garantiert.
        body: JSON.stringify({
          address: ziel.ort,
          dest_typ: ziel.typ,
          lat: ziel.lat,
          lng: ziel.lng,
          bundesland: ziel.bundesland,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error || "start_failed");
      setToken(data.token);
    } catch {
      setStartError("Start fehlgeschlagen — bitte erneut versuchen.");
    }
  }

  const r = result;
  const running = status === "running";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-accent">Klima-Toolbox</p>
        <h1 className="mb-2 text-3xl font-bold text-brand">🌡️ Destinations-Klimacheck</h1>
        {/* Die Fachbegriffe (ERA5, CMIP6) stehen weiter unten in der Methodik,
            wo sie hingehören — hier standen sie im ersten Satz und mussten vom
            Leser übersetzt werden, bevor er wusste, worum es geht. */}
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Wie verändert sich das Klima an <strong>Ihrem Ort</strong> — nicht im Reisegebiet, nicht im
          Landkreis? Der Check legt die gemessenen Jahre 1991–2020 neben das, was die Klimamodelle für
          die Zeit um 2050 rechnen: wie viele warme, heiße und frostige Tage dazukommen oder wegfallen,{" "}
          <strong>wie sich Ihre gute Draußen-Zeit im Jahr verschiebt</strong> — und was daraus für den
          Betrieb folgt.
        </p>
      </header>

      <form onSubmit={start} className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <label htmlFor="destination" className="mb-1 block text-sm font-medium text-slate-700">
          Destination auswählen
        </label>
        <select
          id="destination"
          value={auswahl}
          onChange={(e) => setAuswahl(e.target.value)}
          className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        >
          {TYP_REIHENFOLGE.map((typ) => {
            const gruppe = DESTINATIONEN.filter((d) => d.typ === typ);
            if (!gruppe.length) return null;
            return (
              <optgroup key={typ} label={TYP_LABEL[typ]}>
                {gruppe.map((d) => (
                  <option key={`${d.typ}-${d.ort}`} value={`${d.typ}|${d.ort}`}>
                    {d.ort} ({d.bundesland})
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <p className="mb-4 text-xs text-slate-500">
          {DESTINATIONEN.length} Destinationen in vier Typen. Die Auswertung ist für sie vorberechnet und
          erscheint in Sekunden.
        </p>
        <button
          type="submit"
          disabled={running}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent disabled:opacity-50"
        >
          {running ? "Lade …" : "Klimacheck anzeigen"}
        </button>
        {startError && <p className="mt-2 text-sm text-red-700">{startError}</p>}
        {(status === "error" || status === "timeout" || status === "not_found") && (
          <p className="mt-2 text-sm text-red-700">{errorMessage ?? "Fehler bei der Berechnung — bitte erneut versuchen."}</p>
        )}
      </form>

      {/* Warum keine freie Ortseingabe: der Wetterdienst begrenzt die Abfragen pro
          Serveradresse, und eine frische Berechnung kostet rund hundert davon. */}
      <p className="mb-8 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200">
        <strong className="text-slate-800">Warum eine feste Auswahl?</strong> Eine Destination neu
        durchzurechnen kostet rund hundert Abfragen beim Wetterdienst. Bei freier Ortseingabe lief die Demo
        deshalb regelmäßig in dessen Kontingentgrenze und zeigte Fehler statt Ergebnissen. Für diese
        Destinationen liegt die Auswertung fertig vor. Für Ihre eigene Destination erstellen wir den
        Tiefen-Report — siehe unten.
      </p>

      {running && <div className="mb-8 animate-pulse text-sm text-slate-500">Lade vorberechnete Auswertung …</div>}

      {r && status === "done" && (
        <>
          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">{r.saison.label}</h2>
            <p className="mb-4 text-xs text-slate-500">{r.ort}</p>
            <div className="space-y-2">
              {([["heute", r.saison.heute], ["ziel", r.saison.ziel]] as const).map(([p, s]) => (
                <div key={p} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 text-xs text-slate-500">{p === "heute" ? `heute (${r.perioden.heute})` : `um 2050 (${r.perioden.ziel.replace(" (um 2050)", "")})`}</span>
                  <SeasonBar s={s} highlight={p === "ziel"} />
                  <span className="w-40 shrink-0 text-right text-xs tabular-nums text-slate-700">
                    {doyToDate(s.start_doy)} – {doyToDate(s.ende_doy)} · {s.laenge ?? "–"} Tage
                  </span>
                </div>
              ))}
            </div>
            {r.saison.delta_laenge_tage != null && (
              <p className="mt-3 text-sm font-medium text-slate-800">
                {r.saison.delta_laenge_tage >= 0 ? "▲" : "▼"} Saisonfenster verändert sich um{" "}
                <strong>{Math.abs(r.saison.delta_laenge_tage)} Tage</strong> bis 2050 (gegenüber heute)
                {r.saison.ziel.laenge_min != null && (
                  <span className="text-xs font-normal text-slate-500"> (Modell-Band: {r.saison.ziel.laenge_min}–{r.saison.ziel.laenge_max} Tage Länge)</span>
                )}
              </p>
            )}
          </section>

          <section className="mb-6 overflow-x-auto rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Kenntage pro Jahr</h2>
            <table className="w-full min-w-95 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2">Indikator</th>
                  <th className="pb-2 text-right">heute ({r.perioden.heute})</th>
                  <th className="pb-2 text-right">um 2050</th>
                </tr>
              </thead>
              <tbody>
                {r.indikatoren.map((i) => {
                  const meta = IND_LABEL[i.key] ?? { label: i.key, hint: "" };
                  return (
                    <tr key={i.key} className="border-t border-slate-100">
                      <td className="py-2">
                        <span className="font-medium text-slate-800">{meta.label}</span>{" "}
                        {meta.chance && <span className="text-xs text-emerald-700">Chance</span>}
                        <div className="text-xs text-slate-400">{meta.hint}</div>
                      </td>
                      <td className="py-2 text-right tabular-nums">{i.heute}</td>
                      <td className="py-2 text-right tabular-nums">
                        <strong>{i.ziel.med ?? "–"}</strong>{" "}
                        <span className="text-xs text-slate-400">[{i.ziel.min}–{i.ziel.max}]</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-slate-500">
              „heute" = Klimanormalperiode {r.perioden.heute}. „um 2050" = Median aus {r.modelle.length} CMIP6-Modellen (2036–2050), [Band] = Modell-Spannweite.
            </p>
          </section>

          {(r.handlungsfelder?.length ?? 0) > 0 && (
            <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Handlungsfelder</h2>
              <div className="space-y-3">
                {r.handlungsfelder!.map((h) => (
                  <div key={h.titel} className="rounded-lg bg-slate-50 p-3">
                    <div className="font-medium text-slate-900">{h.titel}</div>
                    <div className="mb-1 text-xs text-slate-500">{h.bezug}</div>
                    <ul className="list-disc pl-5 text-sm text-slate-700">
                      {h.massnahmen.map((m) => <li key={m}>{m}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
              {(r.chancen?.length ?? 0) > 0 && (
                <p className="mt-3 text-sm text-slate-700">
                  <span className="font-medium text-emerald-700">Chancen:</span> {r.chancen!.join(" · ")}
                </p>
              )}
              {r.fazit && <p className="mt-2 text-sm italic text-slate-600">{r.fazit}</p>}
            </section>
          )}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
            <h2 className="mb-2 font-semibold text-slate-900">Amtliche Vertiefung</h2>
            <p className="mb-2">
              Dieser Check ist der Schnell-Einstieg. Für die amtliche Tiefe:{" "}
              <a className="text-brand-accent underline-offset-2 hover:underline" href="https://gis.uba.de/maps/resources/apps/tourismus/index.html?lang=de" target="_blank" rel="noopener noreferrer">UBA „Klimawandel und Tourismus"</a>{" · "}
              <a className="text-brand-accent underline-offset-2 hover:underline" href="https://www.gerics.de/products_and_publications/fact_sheets/landkreise/index.php.de" target="_blank" rel="noopener noreferrer">GERICS-Klimaausblick für Ihren Landkreis</a>{" · "}
              <a className="text-brand-accent underline-offset-2 hover:underline" href="https://www.klivoportal.de/" target="_blank" rel="noopener noreferrer">KLiVO-Katalog</a>
            </p>
            <p className="text-xs text-slate-500">
              Was ist hier anders? Ort-genau statt Reisegebiet/Landkreis · Saisonfenster als berechneter Indikator ·
              Handlungsfelder statt nur Karten · Sofort-Ergebnis statt statischem PDF.
            </p>
          </section>

          <div className="mb-8">
            <DisclaimerBox
              items={[
                "Erstcheck, kein Klimagutachten: CMIP6-Projektionen liegen auf einem ~10–25-km-Raster — kleinräumige Effekte (Küste, Berg, Stadt) bildet das Modell nur begrenzt ab.",
                `Vergleich: Klimanormalperiode 1991–2020 („heute") gegen die Projektion 2036–2050 (die frei verfügbaren CMIP6-Daten enden 2050). Projektion = Median aus ${r.modelle.length} Modellen (${r.modelle.join(", ")}) mit angezeigter Spannweite.`,
                "Badesaison/Aktivtage sind Temperatur-Proxys (Lufttemperatur, kein Wassertemperatur-/Schneemodell).",
                "Handlungsfelder werden KI-gestützt ausschließlich aus den hier berechneten Zahlen und einem kuratierten Maßnahmenkatalog abgeleitet.",
                "Daten: ERA5 (ECMWF/Copernicus) & CMIP6 HighResMIP via Open-Meteo (CC-BY 4.0).",
              ]}
            />
          </div>
        </>
      )}

      <TiefenReportSektion />

      <AboutSection mailSubject="Destinations-Klimacheck" />
    </main>
  );
}

// Zweite Stufe: der Tiefen-Report. Bewusst als eigene Kategorie unter dem
// Quick-Check, weil er ein anderes Produkt ist — andere Datenbasis, anderer
// Umfang, und er wird pro Interessent freigeschaltet statt selbst bedient.
const DEMO_REPORTS: { ort: string; typ: string; kreis: string; kern: string; token?: string }[] = [
  {
    ort: "Winterberg",
    typ: "Mittelgebirge · Wintersport",
    kreis: "Hochsauerlandkreis",
    kern: "Wie lange trägt die Beschneiung? Naturschnee ist auf der höchsten verfügbaren Höhenstufe schon heute knapp und geht im Hochemissionspfad bis Mitte des Jahrhunderts auf null.",
    token: "oAHVFl4s6vYujdT41KTj0A",
  },
  {
    ort: "Sankt Peter-Ording",
    typ: "Küste · Baden",
    kreis: "Nordfriesland",
    kern: "Längere Badesaison als Chance, steigende Hitzebelastung und Extremwetter als Risiko — verschnitten mit der ausgeprägtesten Saisonspitze der fünf Demos.",
    token: "tJLEG1uXcNim97uWWiBc7g",
  },
  {
    ort: "Garmisch-Partenkirchen",
    typ: "Alpen · Ganzjahr",
    kreis: "Garmisch-Partenkirchen",
    kern: "Die Zweiteilung des Gebiets: Die Ortslage verliert ihre Naturschneetage vollständig, die Hochlagen halten deutlich länger.",
    token: "mJ42HJhI_YBh2-MAVS-Njg",
  },
  {
    ort: "Lübeck",
    typ: "Stadt · Ganzjahr mit Küste",
    kreis: "Lübeck, Kreisfreie Stadt",
    kern: "Städtetourismus ist weniger saisonabhängig — dafür trifft steigende Hitzebelastung hier auf Fußgängerzonen und Außengastronomie, und mit Travemünde hängt ein Badebetrieb daran.",
    token: "aqHkerPuWX7LnxFXCoVt6g",
  },
  {
    ort: "Brandenburg",
    typ: "Ganzes Bundesland · Landesmarketing",
    kreis: "Land Brandenburg, 18 Landkreise",
    kern: "Der fünfte Zuschnitt ist kein Ort, sondern ein Land: Median über die 18 Landkreise, und die Spanne zeigt, wo im Land es wen trifft. Die Eistage haben sich seit 1991–2020 halbiert, die heißen Tage nehmen weiter zu — für ein Reiseland, dessen Sommer am Wasser stattfindet, die entscheidende Größe.",
    token: "qO1CNLT18JzCaeM4Gx4Q8Q",
  },
];

function TiefenReportSektion() {
  return (
    <section className="mt-12 rounded-2xl border-2 border-brand/20 bg-white p-6 shadow-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-accent">Stufe 2</p>
      <h2 className="mb-2 text-2xl font-bold text-brand">Tiefen-Report für Ihre Destination</h2>
      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-slate-600">
        Der Quick-Check oben zeigt das Klimasignal. Der Tiefen-Report beantwortet die Frage dahinter:{" "}
        <strong>Wo trifft die Klimaänderung Ihre Saisonkurve?</strong> Dafür verschneiden wir amtliche
        Klimaprojektionen für Ihren Landkreis mit Ihren amtlichen Monats-Übernachtungszahlen und leiten
        daraus Handlungsoptionen ab — jede mit Quelle, Fallbeispiel und der Angabe, wer sie umsetzen kann.
      </p>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { titel: "Amtliche Datenbasis", text: "Klimaausblicke des Helmholtz-Zentrums Hereon für 401 Landkreise, Schneeindikatoren des Copernicus-Dienstes, Beherbergungsstatistik der Statistischen Ämter." },
          { titel: "Zwei Szenarien, zwei Zeitfenster", text: "Mittlerer Pfad und Hochemissionspfad, jeweils für 2036–2065 und 2069–2098 — getrennt ausgewiesen, nie vermischt." },
          { titel: "Auf Ihre Struktur bezogen", text: "Ein 2-Minuten-Profil steuert, welche Kapitel Sie bekommen: Angebotsschwerpunkte, wichtigste Monate, Verwendungszweck." },
        ].map((k) => (
          <div key={k.titel} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="mb-1 text-sm font-semibold text-slate-900">{k.titel}</p>
            <p className="text-xs leading-relaxed text-slate-600">{k.text}</p>
          </div>
        ))}
      </div>

      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Beispiel-Reports
      </h3>
      <ul className="mb-5 space-y-2">
        {DEMO_REPORTS.map((d) => (
          <li key={d.ort} className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <div className="mb-1 flex flex-wrap items-baseline gap-x-3">
              <span className="font-semibold text-slate-900">{d.ort}</span>
              <span className="text-xs text-slate-500">{d.typ}</span>
            </div>
            <p className="mb-2 text-sm leading-relaxed text-slate-600">{d.kern}</p>
            {d.token ? (
              <a
                href={`/klimafit-check/report/${d.token}`}
                className="text-sm font-semibold text-brand-accent underline-offset-2 hover:underline"
              >
                Report ansehen →
              </a>
            ) : (
              <span className="text-xs text-slate-400">Report wird gerade erstellt</span>
            )}
          </li>
        ))}
      </ul>

      <a
        href="/klimafit-check/tiefen-report"
        className="inline-block rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent"
      >
        Tiefen-Report anfordern
      </a>
      <span className="ml-3 text-xs text-slate-500">2 Minuten Profil-Angaben</span>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Der Report ersetzt kein Klimaanpassungskonzept nach dem UBA-Leitfaden und keine Vollberatung. Er
        liefert die Daten- und Faktenbasis für Betroffenheitsanalyse und Gremienvorlage. Alle Szenarien sind
        Bandbreiten möglicher Entwicklungen, keine Vorhersagen.
      </p>
    </section>
  );
}
