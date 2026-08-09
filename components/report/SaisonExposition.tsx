// Saisonale Expositions-Analyse.
//
// Die meisten Klimaquellen liefern Jahres- oder Saisonwerte, keine Monatsreihen.
// Statt die Verschneidung dann wegzulassen, wird der Indikator den Monaten
// zugeordnet, in denen er entsteht — Schneetage dem Winter, Hitzetage dem
// Sommer. Gröber als eine Monatsrechnung, und genau so wird es hier auch benannt.

export type SaisonExpositionT = {
  art: "saisonal";
  indikator: string;
  indikator_label: string;
  einheit: string;
  szenario: string;
  zeitfenster: string;
  wirkmonate: string[];
  referenz: number;
  zukunft: number;
  delta: number;
  richtung: "chance" | "risiko" | "neutral";
  richtung_label: string;
  anteil_uebernachtungen: number;
  naechte_in_wirkmonaten?: number;
  label: string;
  einordnung: string;
  methodik: string;
  validitaet: string;
};

const SZENARIO: Record<string, string> = {
  rcp45: "RCP4.5 — mittlerer Pfad",
  rcp85: "RCP8.5 — Hochemissionspfad",
};

// Blau gegen Orange statt Rot-Grün: bleibt auch bei Farbsehschwäche unterscheidbar,
// und die Richtung steht zusätzlich als Text daneben.
const FARBE: Record<string, { rand: string; feld: string; text: string }> = {
  chance: { rand: "ring-sky-200", feld: "bg-sky-50", text: "text-sky-900" },
  risiko: { rand: "ring-orange-200", feld: "bg-orange-50", text: "text-orange-900" },
  neutral: { rand: "ring-slate-200", feld: "bg-slate-50", text: "text-slate-700" },
};

function zahl(n: number) {
  return Math.abs(n) >= 100 ? Math.round(n).toLocaleString("de-DE") : (Math.round(n * 10) / 10).toLocaleString("de-DE");
}

export default function SaisonExposition({ eintraege }: { eintraege: SaisonExpositionT[] }) {
  // Nur die Indikatoren zeigen, die sich überhaupt bewegen — eine Liste aus
  // 37 Zeilen, von denen 30 "kaum verändert" sagen, liest niemand.
  const relevant = eintraege.filter((e) => e.richtung !== "neutral");
  if (!relevant.length) return null;

  // Je Indikator das ungünstigste Szenario zuerst, damit die Reihenfolge stabil ist.
  const sortiert = [...relevant].sort((a, b) => {
    if (a.richtung !== b.richtung) return a.richtung === "risiko" ? -1 : 1;
    return b.anteil_uebernachtungen - a.anteil_uebernachtungen;
  });

  return (
    <div className="space-y-3">
      {sortiert.map((e, i) => {
        const f = FARBE[e.richtung] ?? FARBE.neutral;
        return (
          <figure key={`${e.indikator}-${e.szenario}-${e.zeitfenster}-${i}`}
                  className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ${f.rand}`}>
            <figcaption className="mb-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h4 className="font-semibold text-slate-900">{e.indikator_label}</h4>
                <span className="text-xs text-slate-500">
                  {SZENARIO[e.szenario] ?? e.szenario} · {e.zeitfenster}
                </span>
              </div>
              <p className="mt-1 inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                {e.label}
              </p>
            </figcaption>

            <div className={`grid gap-3 rounded-xl p-3 sm:grid-cols-3 ${f.feld}`}>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">heute</p>
                <p className="text-lg font-bold text-slate-900">
                  {zahl(e.referenz)} <span className="text-sm font-normal">{e.einheit.split("/")[0]}</span>
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">im Szenario</p>
                <p className={`text-lg font-bold ${f.text}`}>
                  {zahl(e.zukunft)} <span className="text-sm font-normal">{e.einheit.split("/")[0]}</span>
                  <span className="ml-2 text-sm">({e.delta > 0 ? "+" : "−"}{zahl(Math.abs(e.delta))})</span>
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">betroffener Anteil</p>
                <p className="text-lg font-bold text-slate-900">
                  {Math.round(e.anteil_uebernachtungen * 100)} %
                </p>
                {e.naechte_in_wirkmonaten != null && (
                  <p className="text-xs text-slate-600">
                    rund {e.naechte_in_wirkmonaten.toLocaleString("de-DE")} Nächte
                  </p>
                )}
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-600">
              <span className="font-medium">{e.richtung_label}</span> · wirksam in{" "}
              {e.wirkmonate.join(", ")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{e.methodik}</p>
          </figure>
        );
      })}
    </div>
  );
}
