// Chancen-/Risiko-Monatsmatrix — das Herzstück des Reports.
//
// Zwei Gestaltungsregeln, die nicht verhandelbar sind:
// 1. Das Label "Expositions-Analyse, keine Nachfrageprognose" steht IN der Grafik.
//    Grafiken werden einzeln geteilt und verlieren dabei jede Fußnote.
// 2. Keine Rot-Grün-Skala: Blau (Chance) gegen Orange (Risiko) bleibt auch bei
//    Rot-Grün-Sehschwäche unterscheidbar, und die Richtung steht zusätzlich als Text da.

export type MatrixMonat = {
  monat: number;
  name: string;
  verfuegbar: boolean;
  anteil: number | null;
  referenz?: number;
  zukunft?: number;
  delta?: number;
  richtung?: "chance" | "risiko" | "neutral";
  richtung_label?: string;
  exponierte_naechte?: number;
};

export type MatrixT = {
  verfuegbar: boolean;
  indikator_label: string;
  einheit: string;
  szenario: string;
  zeitfenster: string;
  monate: MatrixMonat[];
  summe: {
    exponierter_anteil_risiko: number;
    exponierter_anteil_chance: number;
    monate_risiko: string[];
    monate_chance: string[];
    exponierte_naechte_risiko?: number;
    exponierte_naechte_chance?: number;
    bezug?: string;
  };
  label: string;
  einordnung: string;
  schwellen_hinweis: string;
};

const SZENARIO: Record<string, string> = {
  rcp45: "RCP4.5 — mittlerer Pfad",
  rcp85: "RCP8.5 — Hochemissionspfad",
};

function farbe(m: MatrixMonat) {
  if (!m.verfuegbar || m.richtung === "neutral" || !m.richtung) return "bg-slate-100 text-slate-500";
  return m.richtung === "chance" ? "bg-sky-600 text-white" : "bg-orange-500 text-white";
}

export default function Monatsmatrix({ matrix }: { matrix: MatrixT }) {
  if (!matrix.verfuegbar) return null;
  const maxAnteil = Math.max(...matrix.monate.map((m) => m.anteil ?? 0), 0.01);

  return (
    <figure className="mb-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <figcaption className="mb-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="font-semibold text-slate-900">{matrix.indikator_label}</h3>
          <span className="text-xs text-slate-500">
            {SZENARIO[matrix.szenario] ?? matrix.szenario} · {matrix.zeitfenster}
          </span>
        </div>
        {/* Pflicht-Label direkt in der Grafik, nicht im Kleingedruckten. */}
        <p className="mt-1 inline-block rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          {matrix.label}
        </p>
      </figcaption>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-y-1 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-2 py-1 font-medium">Monat</th>
              <th className="px-2 py-1 font-medium">Anteil Übernachtungen</th>
              <th className="px-2 py-1 font-medium">heute</th>
              <th className="px-2 py-1 font-medium">Szenario</th>
              <th className="px-2 py-1 font-medium">Änderung</th>
              <th className="px-2 py-1 font-medium">Einordnung</th>
            </tr>
          </thead>
          <tbody>
            {matrix.monate.map((m) => (
              <tr key={m.monat} className="align-middle">
                <td className="px-2 py-1 font-medium text-slate-800">{m.name}</td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-24 overflow-hidden rounded bg-slate-100">
                      <div
                        className="h-2.5 rounded bg-slate-400"
                        style={{ width: `${((m.anteil ?? 0) / maxAnteil) * 100}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-xs text-slate-500">
                      {m.anteil != null ? `${(m.anteil * 100).toFixed(1)} %` : "–"}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-1 tabular-nums text-slate-600">
                  {m.referenz != null ? m.referenz.toLocaleString("de-DE") : "–"}
                </td>
                <td className="px-2 py-1 tabular-nums text-slate-600">
                  {m.zukunft != null ? m.zukunft.toLocaleString("de-DE") : "–"}
                </td>
                <td className="px-2 py-1">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums ${farbe(m)}`}>
                    {m.delta != null ? `${m.delta > 0 ? "+" : "−"}${Math.abs(m.delta).toLocaleString("de-DE")}` : "–"}
                  </span>
                </td>
                <td className="px-2 py-1 text-xs text-slate-600">{m.richtung_label ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-orange-50 p-3 ring-1 ring-orange-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-900">
            Exponiert (ungünstige Änderung)
          </p>
          <p className="mt-1 text-xl font-bold text-orange-900">
            {(matrix.summe.exponierter_anteil_risiko * 100).toFixed(0)} % der Übernachtungen
          </p>
          {matrix.summe.exponierte_naechte_risiko != null && (
            <p className="text-sm text-orange-900">
              rund {matrix.summe.exponierte_naechte_risiko.toLocaleString("de-DE")} Nächte
            </p>
          )}
          <p className="mt-1 text-xs text-orange-800">
            {matrix.summe.monate_risiko.join(", ") || "keine Monate"}
          </p>
        </div>
        <div className="rounded-xl bg-sky-50 p-3 ring-1 ring-sky-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">
            Chance (günstige Änderung)
          </p>
          <p className="mt-1 text-xl font-bold text-sky-900">
            {(matrix.summe.exponierter_anteil_chance * 100).toFixed(0)} % der Übernachtungen
          </p>
          {matrix.summe.exponierte_naechte_chance != null && (
            <p className="text-sm text-sky-900">
              rund {matrix.summe.exponierte_naechte_chance.toLocaleString("de-DE")} Nächte
            </p>
          )}
          <p className="mt-1 text-xs text-sky-800">
            {matrix.summe.monate_chance.join(", ") || "keine Monate"}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-600">{matrix.einordnung}</p>
      <p className="mt-1 text-xs text-slate-500">{matrix.schwellen_hinweis}</p>
      {matrix.summe.bezug && <p className="text-xs text-slate-500">{matrix.summe.bezug}</p>}
    </figure>
  );
}
