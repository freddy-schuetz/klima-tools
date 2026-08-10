// Klima-Analogon — bewusst als Kommunikations-Element gestaltet, nicht als Analyse.
//
// Die Formulierung ist festgelegt: „Die Klimatologie von X ähnelt im Szenario Y
// am ehesten dem heutigen Klima von Z" — niemals „X wird wie Z". Und die
// Einschränkungen stehen IN der Grafik, nicht im Kleingedruckten: Grafiken
// werden einzeln geteilt und verlieren dabei jede Fußnote.

import { SZENARIO_SATZ } from "@/lib/klartext";

export type AnalogonWolke = {
  verfuegbar: boolean;
  haeufigste: [string, number][];
  einigkeit: number;
  modelle: number;
  caveat: string;
  je_modell: Record<string, { verfuegbar: boolean; guete?: string; guete_text?: string;
                              treffer?: { name: string; land?: string; hoehe_m?: number; distanz: number }[] }>;
};

export type AnalogonT = {
  verfuegbar: boolean;
  je_szenario: Record<string, AnalogonWolke>;
  stand?: string;
  einordnung: string;
  methodik: string;
};

// Kein eigener Vorrat an Szenario-Namen: Zwei Kopien derselben Liste sind zwei
// Chancen, dass eine davon beim naechsten Umbau stehen bleibt — genau das ist
// hier passiert, das Kapitel sagte noch "mittlerer Pfad".
const SZENARIO = SZENARIO_SATZ;

function einigkeitsText(w: AnalogonWolke) {
  const anteil = Math.round(w.einigkeit * 100);
  if (anteil >= 67)
    return `${anteil} % der Modellketten zeigen dieselbe Region — ein belastbares Bild.`;
  if (anteil >= 50) return `${anteil} % der Modellketten stimmen überein.`;
  return `Die ${w.modelle} Modellketten zeigen auf unterschiedliche Regionen. Das ist kein Fehler, sondern das Ergebnis: Die Richtung ist erkennbar, der genaue Zielort nicht.`;
}

export default function Analogon({ analogon }: { analogon: AnalogonT }) {
  if (!analogon?.verfuegbar) return null;
  const szenarien = Object.entries(analogon.je_szenario ?? {});
  if (!szenarien.length) return null;

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-slate-600">{analogon.einordnung}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {szenarien.map(([szenario, w]) => (
          <figure key={szenario} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {SZENARIO[szenario] ?? szenario}
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                zur Veranschaulichung
              </span>
            </figcaption>

            <ul className="mb-3 space-y-1.5">
              {(w.haeufigste ?? []).slice(0, 3).map(([name, stimmen]) => (
                <li key={name} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-800">{name}</span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {stimmen} von {w.modelle} Modellketten
                  </span>
                </li>
              ))}
            </ul>

            <p className="text-xs leading-relaxed text-slate-600">{einigkeitsText(w)}</p>
          </figure>
        ))}
      </div>

      {/* Pflicht-Caveat direkt an der Grafik */}
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950 ring-1 ring-amber-200">
        <strong>Was dieser Vergleich nicht sagt:</strong>{" "}
        {szenarien[0]?.[1]?.caveat ??
          "Die Ähnlichkeit bezieht sich auf Temperatur und Niederschlag — nicht auf Extremereignisse, Schneesicherheit, Höhen- oder Küstenlage und nicht auf die Tageslänge."}
      </p>

      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-700">So wurde gerechnet</summary>
        <p className="mt-2 leading-relaxed">{analogon.methodik}</p>
      </details>
    </div>
  );
}
