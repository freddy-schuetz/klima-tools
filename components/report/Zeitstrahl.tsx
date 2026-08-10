/**
 * Zeitstrahl einer Kennzahl: die gemessene Linie und ihre Fortsetzung.
 *
 * Aufgebaut wie der Prognose-Fächer im Prognose-Labor — eine dunkle Linie für
 * das Gemessene, je Szenario eine Fortsetzung mit hinterlegtem Korridor, eine
 * senkrechte Marke am Übergang. Mehr nicht.
 *
 * Drei Fassungen davor sind gescheitert, und immer am selben Punkt: Sie zeigten
 * Kästen, Balken oder vier sich überlagernde Korridore NEBEN der Messkurve
 * statt einer Fortsetzung. Der Grund lag nicht in der Zeichnung, sondern in den
 * Zahlen — eine Klimaprojektion gibt ihre Änderung gegenüber IHRER eigenen
 * Bezugsperiode an und beginnt deshalb irgendwo in der Vergangenheit.
 *
 * Gelöst ist das im Backend: `verlauf` liefert je Szenario eine fertige Kurve,
 * die am letzten Messwert ansetzt und die Modelländerung von dort aus aufträgt.
 * Zwei Quellen werden dabei zu einer Linie zusammengeführt, weil sich ihr
 * jeweiliger Bias mit der eigenen Basis herauskürzt. Diese Komponente zeichnet
 * nur noch, was dort steht.
 */
"use client";

export type VerlaufsstuetzeT = {
  jahr: number;
  mitte: number;
  unten: number | null;
  oben: number | null;
  quelle_id: string;
  eigenrechnung: boolean;
  fenster: string;
};

export type ZeitstrahlT = {
  indikator: string;
  label: string;
  einheit: string;
  referenzperiode: string;
  hoeher_ist_besser: boolean;
  luecke: { von: number; bis: number } | null;
  hinweis_messung: string;
  einordnung_messung: { lage: string; text: string } | null;
  kernaussagen?: {
    bereits?: string;
    richtung?: string;
    hoehe?: string;
    selbst_obergrenze?: string;
    modellversatz?: string;
  };
  verlauf?: { szenario: string; stuetzen: VerlaufsstuetzeT[] }[];
  messung: {
    jahre: number[];
    werte: (number | null)[];
    trend: (number | null)[];
    perioden: Record<string, number>;
    letztes_jahr: number;
    trend_endet?: number | null;
    mittel_letzte_zehn: number;
  };
  projektion: { eigenrechnung?: boolean }[];
};

// Ein Szenario wird über seine URSACHE benannt, nicht über seine Kennziffer.
// "RCP8.5" sagt niemandem etwas, "gedämpfter Pfad" auch nicht — es ist ja nicht
// der Pfad gedämpft, sondern der Ausstoß. Dieselben Bezeichnungen stehen im
// Backend in report/klartext.py; sie müssen zusammenbleiben.
const SZENARIO: Record<string, { name: string; farbe: string }> = {
  rcp45: { name: "wenn der Ausstoß ab etwa 2040 sinkt", farbe: "#0284c7" },
  rcp85: { name: "wenn der Ausstoß weiter steigt", farbe: "#dc2626" },
  rcp26: { name: "wenn der Ausstoß schnell sinkt", farbe: "#16a34a" },
};

const MESSFARBE = "#14532d";
const B = 760;
const H = 250;
const RAND = { links: 46, rechts: 74, oben: 18, unten: 30 };

const zahl = (n: number | null | undefined, stellen = 0) =>
  n == null || Number.isNaN(n)
    ? "–"
    : n.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });

export default function Zeitstrahl({ strahl }: { strahl: ZeitstrahlT }) {
  const m = strahl.messung;
  const jahre = m.jahre ?? [];
  if (jahre.length === 0) return null;
  const kurven = strahl.verlauf ?? [];

  const messwerte = m.werte.filter((w): w is number => w != null);
  const kurvenwerte = kurven.flatMap((k) =>
    k.stuetzen.flatMap((s) => [s.mitte, s.unten, s.oben].filter((v): v is number => v != null)),
  );
  const obergrenze = Math.max(...messwerte, ...kurvenwerte, 1) * 1.05;
  const jahrVon = Math.min(...jahre);
  const jahrBis = Math.max(
    m.letztes_jahr + 5,
    ...kurven.flatMap((k) => k.stuetzen.map((s) => s.jahr)),
  );

  const x = (jahr: number) =>
    RAND.links + ((jahr - jahrVon) / (jahrBis - jahrVon)) * (B - RAND.links - RAND.rechts);
  const y = (wert: number) => RAND.oben + (1 - wert / obergrenze) * (H - RAND.oben - RAND.unten);

  const pfad = (stuetzen: VerlaufsstuetzeT[], feld: "mitte" | "oben" | "unten") =>
    stuetzen
      .map((s, i) => `${i === 0 ? "M" : "L"}${x(s.jahr).toFixed(1)},${y(s[feld] ?? s.mitte).toFixed(1)}`)
      .join(" ");

  const trendpfad = jahre
    .map((jahr, i) => ({ jahr, wert: m.trend[i] }))
    .filter((p): p is { jahr: number; wert: number } => p.wert != null)
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.jahr).toFixed(1)},${y(p.wert).toFixed(1)}`)
    .join(" ");
  const trendEnde = m.trend_endet ?? null;
  const trendEndwert = trendEnde != null ? m.trend[jahre.indexOf(trendEnde)] : null;

  const nachkomma = obergrenze < 20 ? 1 : 0;
  const gitter = [0, 0.5, 1].map((f) => f * obergrenze);
  const marken = [1960, 1980, 2000, 2020, 2040, 2060, 2080].filter((j) => j >= jahrVon && j <= jahrBis);

  // Endbeschriftungen auseinanderziehen, damit sie sich nicht überdecken.
  const enden = kurven
    .map((k) => ({ szenario: k.szenario, wert: k.stuetzen[k.stuetzen.length - 1].mitte }))
    .sort((a, b) => b.wert - a.wert);
  const beschriftet: { szenario: string; wert: number; yy: number }[] = [];
  for (const e of enden) {
    let yy = y(e.wert);
    const letzter = beschriftet[beschriftet.length - 1];
    if (letzter && yy - letzter.yy < 13) yy = letzter.yy + 13;
    beschriftet.push({ ...e, yy });
  }

  const k = strahl.kernaussagen ?? {};

  return (
    <figure className="mb-6 break-inside-avoid rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 print:shadow-none">
      <figcaption className="mb-3">
        <h4 className="text-base font-semibold text-brand">{strahl.label}</h4>
        {k.bereits && <p className="mt-1 text-lg font-bold leading-snug text-brand">{k.bereits}</p>}
        {(k.richtung || k.hoehe) && (
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {k.richtung} {k.hoehe} {k.selbst_obergrenze}
          </p>
        )}
      </figcaption>

      <svg viewBox={`0 0 ${B} ${H}`} className="h-auto w-full" role="img"
           aria-label={[k.bereits, k.richtung, k.hoehe].filter(Boolean).join(" ")}>
        {gitter.map((w) => (
          <g key={w}>
            <line x1={RAND.links} y1={y(w)} x2={B - RAND.rechts} y2={y(w)} stroke="#e8ecf1" strokeWidth="1" />
            <text x={RAND.links - 8} y={y(w) + 3.5} textAnchor="end" fontSize="10.5" fill="#94a3b8">
              {zahl(w, nachkomma)}
            </text>
          </g>
        ))}

        {/* Korridore, dann Linien darüber */}
        {kurven.map((kurve) => (
          <path key={`${kurve.szenario}-band`}
                d={`${pfad(kurve.stuetzen, "oben")} ${[...kurve.stuetzen]
                  .reverse()
                  .map((s) => `L${x(s.jahr).toFixed(1)},${y(s.unten ?? s.mitte).toFixed(1)}`)
                  .join(" ")} Z`}
                fill={SZENARIO[kurve.szenario]?.farbe ?? "#64748b"} opacity="0.12" />
        ))}

        {/* Gemessene Einzeljahre — sehr zurückhaltend, sie sind Kontext, nicht Aussage */}
        {jahre.map((jahr, i) => {
          const w = m.werte[i];
          if (w == null) return null;
          // Kräftiger als zuvor: mit #dfe5ec waren die Einzeljahre auf dem
          // Bildschirm kaum und im Ausdruck gar nicht zu sehen — dabei sind sie
          // das Argument dafür, dass ein einzelner Sommer nichts beweist.
          return <circle key={jahr} cx={x(jahr)} cy={y(w)} r="1.9" fill="#9fb0c4" />;
        })}

        <path d={trendpfad} fill="none" stroke={MESSFARBE} strokeWidth="2.6" strokeLinejoin="round" />
        {trendEnde != null && trendEndwert != null && (
          <line x1={x(trendEnde)} y1={y(trendEndwert)}
                x2={x(m.letztes_jahr)} y2={y(m.mittel_letzte_zehn)}
                stroke={MESSFARBE} strokeWidth="2.6" />
        )}

        {kurven.map((kurve) => (
          <path key={`${kurve.szenario}-linie`} d={pfad(kurve.stuetzen, "mitte")} fill="none"
                stroke={SZENARIO[kurve.szenario]?.farbe ?? "#64748b"} strokeWidth="2.4"
                strokeDasharray="6 4" strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {/* Übergang */}
        <line x1={x(m.letztes_jahr)} y1={RAND.oben} x2={x(m.letztes_jahr)} y2={H - RAND.unten}
              stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 3" />
        <text x={x(m.letztes_jahr) - 6} y={RAND.oben + 9} textAnchor="end" fontSize="10" fill="#94a3b8">
          ab hier modelliert
        </text>

        {beschriftet.map((e) => (
          <text key={e.szenario} x={B - RAND.rechts + 6} y={e.yy + 3.5} fontSize="11"
                fill={SZENARIO[e.szenario]?.farbe ?? "#64748b"} fontWeight="700">
            {zahl(e.wert, nachkomma)}
          </text>
        ))}

        <line x1={RAND.links} y1={H - RAND.unten} x2={B - RAND.rechts} y2={H - RAND.unten}
              stroke="#e2e8f0" strokeWidth="1" />
        {marken.map((j) => (
          <text key={j} x={x(j)} y={H - RAND.unten + 14} textAnchor="middle" fontSize="10.5" fill="#94a3b8">
            {j}
          </text>
        ))}
      </svg>

      <ul className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-600">
        <li className="flex items-center gap-1.5">
          <svg width="20" height="8" aria-hidden><line x1="0" y1="4" x2="20" y2="4" stroke={MESSFARBE} strokeWidth="2.6" /></svg>
          gemessen (Mittel über elf Jahre)
        </li>
        <li className="flex items-center gap-1.5">
          <svg width="12" height="8" aria-hidden><circle cx="6" cy="4" r="1.9" fill="#9fb0c4" /></svg>
          einzelnes Jahr
        </li>
        {kurven.map((kurve) => (
          <li key={kurve.szenario} className="flex items-center gap-1.5">
            <svg width="20" height="8" aria-hidden>
              <line x1="0" y1="4" x2="20" y2="4" stroke={SZENARIO[kurve.szenario]?.farbe ?? "#64748b"}
                    strokeWidth="2.4" strokeDasharray="6 4" />
            </svg>
            {SZENARIO[kurve.szenario]?.name ?? kurve.szenario}
          </li>
        ))}
        <li className="text-slate-500">Fläche = Spanne der Modelle</li>
      </ul>

      {strahl.einordnung_messung && (
        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200">
          <strong className="text-brand">Was das heißt: </strong>
          {strahl.einordnung_messung.text}
        </p>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        {strahl.hinweis_messung} Die Modellkurven tragen die berechnete Änderung auf das zuletzt
        gemessene Jahrzehnt auf; sie setzen deshalb dort an, wo die Messung endet. In den
        Tabellen stehen die Werte auf ihre jeweilige Bezugsperiode bezogen und weichen davon ab.
        Die Spannen gelten für Mehrjahresmittel, nicht für einzelne Jahre.
      </p>
    </figure>
  );
}
