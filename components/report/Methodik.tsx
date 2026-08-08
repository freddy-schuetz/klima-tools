// Methodik-Anhang. Der Abschnitt, der den Validitätsanspruch einlöst — deshalb
// gehören auch die NICHT bestandenen Validierungskriterien sichtbar hinein.

export type QuelleT = {
  id: string;
  titel: string;
  herausgeber: string;
  rang: "beobachtung" | "projektion" | "branche";
  rang_nr: number;
  url?: string;
  lizenz?: string;
  attribution?: string;
  stand?: string;
};

export type ValidierungT = {
  kriterium: string;
  gebiet: string;
  erwartet: string;
  gemessen: string;
  abweichung: string;
  bestanden: boolean;
  bemerkung?: string;
};

const RANG_TITEL: Record<string, { titel: string; erklaerung: string }> = {
  beobachtung: {
    titel: "1. Amtliche Beobachtung",
    erklaerung: "Gemessene Werte. Die belastbarste Ebene — hier wird nichts modelliert.",
  },
  projektion: {
    titel: "2. Peer-reviewte Projektion",
    erklaerung:
      "Modellrechnungen aus der Fachliteratur bzw. dem Copernicus-Dienst. Sie zeigen Bandbreiten möglicher Entwicklungen, keine Vorhersagen.",
  },
  branche: {
    titel: "3. Branchen- und Praxisangaben",
    erklaerung: "Angaben von Verbänden, Betreibern und Destinationen — nützlich als Kontext, nicht als Beleg.",
  },
};

export function Quellenverzeichnis({ quellen }: { quellen: QuelleT[] }) {
  const gruppen = (["beobachtung", "projektion", "branche"] as const)
    .map((rang) => ({ rang, eintraege: quellen.filter((q) => q.rang === rang) }))
    .filter((g) => g.eintraege.length);

  return (
    <div className="space-y-5">
      {gruppen.map(({ rang, eintraege }) => (
        <div key={rang}>
          <h4 className="text-sm font-semibold text-slate-900">{RANG_TITEL[rang].titel}</h4>
          <p className="mb-2 text-xs text-slate-500">{RANG_TITEL[rang].erklaerung}</p>
          <ul className="space-y-1.5">
            {eintraege.map((q) => (
              <li key={q.id} className="text-sm text-slate-700">
                <span className="font-medium">{q.titel}</span>
                {" — "}
                {q.herausgeber}
                {q.lizenz && <span className="text-slate-500"> · {q.lizenz}</span>}
                {q.url && (
                  <>
                    {" "}
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-accent underline-offset-2 hover:underline"
                    >
                      Quelle
                    </a>
                  </>
                )}
                {q.attribution && <div className="text-xs text-slate-500">{q.attribution}</div>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function Validierungstabelle({ zeilen }: { zeilen: ValidierungT[] }) {
  if (!zeilen.length) {
    return (
      <p className="text-sm text-slate-600">
        Für dieses Gebiet liegen noch keine Ergebnisse des Validierungslaufs vor.
      </p>
    );
  }
  const durchgefallen = zeilen.filter((z) => !z.bestanden).length;

  return (
    <div>
      <p className="mb-2 text-sm text-slate-600">
        Vor der Anzeige von Projektionen prüfen wir, ob unsere Rechnung die amtlichen Beobachtungs- und
        Referenzwerte reproduziert. {zeilen.length} Kriterien geprüft,{" "}
        {durchgefallen === 0 ? "alle bestanden" : `${durchgefallen} nicht bestanden`}.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-1 pr-3 font-medium">Kriterium</th>
              <th className="py-1 pr-3 font-medium">Gebiet</th>
              <th className="py-1 pr-3 font-medium">erwartet</th>
              <th className="py-1 pr-3 font-medium">gemessen</th>
              <th className="py-1 pr-3 font-medium">Abweichung</th>
              <th className="py-1 font-medium">Ergebnis</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z, i) => (
              <tr key={i} className="border-t border-slate-100 align-top">
                <td className="py-1.5 pr-3 text-slate-800">
                  {z.kriterium}
                  {z.bemerkung && <div className="text-xs text-slate-500">{z.bemerkung}</div>}
                </td>
                <td className="py-1.5 pr-3 text-slate-600">{z.gebiet}</td>
                <td className="py-1.5 pr-3 tabular-nums text-slate-600">{z.erwartet}</td>
                <td className="py-1.5 pr-3 tabular-nums text-slate-600">{z.gemessen}</td>
                <td className="py-1.5 pr-3 tabular-nums text-slate-600">{z.abweichung}</td>
                <td className="py-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      z.bestanden ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {z.bestanden ? "bestanden" : "abweichend"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Was der Report NICHT beantworten konnte. Sichtbar, nicht versteckt: eine
// ausgewiesene Lücke ist ehrlicher als ein geschätzter Ersatzwert.
export function Luecken({ luecken }: { luecken: string[] }) {
  if (!luecken.length) return null;
  return (
    <div className="mb-6 rounded-xl border border-slate-300 bg-slate-50 p-4">
      <p className="mb-2 text-sm font-semibold text-slate-900">
        Was dieser Report (noch) nicht beantwortet
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
        {luecken.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  );
}
