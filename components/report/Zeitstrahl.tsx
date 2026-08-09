/**
 * Zeitstrahl einer Kennzahl: gemessene Vergangenheit und projizierte Zukunft
 * in EINEM Bild.
 *
 * Der Kern der Aussage ist die durchgezogene Messkurve — sie zeigt, dass die
 * Veränderung bereits stattgefunden hat. Die Modellbänder stehen daneben, nicht
 * darüber. Zwischen dem letzten Messjahr und dem ersten Projektionsfenster
 * bleibt eine Lücke sichtbar und beschriftet; sie zuzumalen wäre die bequemere,
 * aber unehrliche Lösung.
 *
 * Handgeschriebenes SVG statt Diagrammbibliothek: hält den Druck sauber, die
 * Seite klein und die Beschriftung unter Kontrolle.
 */
"use client";

export type ProjektionsfensterT = {
  von: number;
  bis: number;
  szenario: string;
  mitte: number;
  unten: number | null;
  oben: number | null;
  quelle_id: string;
  ensemble_n?: number | null;
  bandbreite_art?: string;
  auf_messniveau_gesetzt?: boolean;
};

export type ZeitstrahlT = {
  indikator: string;
  label: string;
  einheit: string;
  referenzperiode: string;
  hoeher_ist_besser: boolean;
  bereits_veraendert: number | null;
  luecke: { von: number; bis: number } | null;
  hinweis_messung: string;
  hinweis_projektion: string;
  einordnung_messung: { lage: string; text: string; anteil_erreicht: number | null } | null;
  messung: {
    jahre: number[];
    werte: (number | null)[];
    trend: (number | null)[];
    perioden: Record<string, number>;
    extremjahre: { jahr: number; wert: number }[];
    letztes_jahr: number;
    mittel_letzte_zehn: number;
  };
  projektion: ProjektionsfensterT[];
};

const SZENARIO_FARBE: Record<string, string> = {
  rcp45: "#0284c7", // gedämpfter Pfad
  rcp85: "#dc2626", // Hochemissionspfad
};

const SZENARIO_NAME: Record<string, string> = {
  rcp45: "RCP4.5 — gedämpfter Pfad",
  rcp85: "RCP8.5 — Hochemissionspfad",
};

const MESSFARBE = "#14532d";

// Zeichenfläche. Die Werte sind die inneren Koordinaten des viewBox — die
// Grafik skaliert über preserveAspectRatio auf die volle Spaltenbreite.
const B = 760;
const H = 250;
const RAND = { links: 42, rechts: 10, oben: 14, unten: 30 };
const JAHR_VON = 1951;
const JAHR_BIS = 2100;

function zahl(n: number | null | undefined, stellen = 0): string {
  if (n == null || Number.isNaN(n)) return "–";
  return n.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
}

export default function Zeitstrahl({ strahl }: { strahl: ZeitstrahlT }) {
  const m = strahl.messung;
  const jahre = m.jahre ?? [];
  if (jahre.length === 0) return null;

  const alleWerte: number[] = [
    ...m.werte.filter((w): w is number => w != null),
    ...strahl.projektion.flatMap((p) => [p.mitte, p.unten, p.oben].filter((v): v is number => v != null)),
  ];
  const maxWert = Math.max(...alleWerte, 1);
  const obergrenze = maxWert * 1.08;

  const x = (jahr: number) =>
    RAND.links + ((jahr - JAHR_VON) / (JAHR_BIS - JAHR_VON)) * (B - RAND.links - RAND.rechts);
  const y = (wert: number) =>
    RAND.oben + (1 - wert / obergrenze) * (H - RAND.oben - RAND.unten);

  // Gleitendes Mittel als Pfad; Randjahre ohne Fenster bleiben leer.
  const trendpfad = jahre
    .map((jahr, i) => ({ jahr, wert: m.trend[i] }))
    .filter((p): p is { jahr: number; wert: number } => p.wert != null)
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.jahr).toFixed(1)},${y(p.wert).toFixed(1)}`)
    .join(" ");

  const gitterwerte = [0, 0.25, 0.5, 0.75, 1].map((f) => f * obergrenze);
  const jahresmarken = [1960, 1980, 2000, 2020, 2040, 2060, 2080, 2100];

  const referenzwert = strahl.messung.perioden[strahl.referenzperiode];
  const heute = m.mittel_letzte_zehn;

  // Für die Kopfzeile das aussagekräftigste Fenster: der Hochemissionspfad im
  // näheren Zeitraum — er liegt im Planungshorizont heutiger Entscheidungen.
  const leitfenster =
    strahl.projektion.find((p) => p.szenario === "rcp85" && p.von <= 2065) ??
    strahl.projektion.find((p) => p.szenario === "rcp85") ??
    strahl.projektion[0];

  const nachkomma = strahl.einheit.includes("°C") || Math.abs(heute) < 5 ? 1 : 0;

  return (
    <figure className="mb-5 break-inside-avoid rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 print:shadow-none">
      <figcaption className="mb-3">
        <h4 className="text-base font-semibold text-brand">{strahl.label}</h4>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-slate-700">
          <Etappe titel={strahl.referenzperiode} wert={zahl(referenzwert, nachkomma)} />
          <span aria-hidden className="text-slate-300">→</span>
          <Etappe titel="heute (Mittel 2016–2025)" wert={zahl(heute, nachkomma)} betont />
          {leitfenster && (
            <>
              <span aria-hidden className="text-slate-300">→</span>
              <Etappe
                titel={`${leitfenster.von}–${leitfenster.bis}, RCP8.5`}
                wert={
                  leitfenster.unten != null && leitfenster.oben != null
                    ? `${zahl(leitfenster.unten, nachkomma)}–${zahl(leitfenster.oben, nachkomma)}`
                    : zahl(leitfenster.mitte, nachkomma)
                }
              />
            </>
          )}
          <span className="text-xs text-slate-500">{strahl.einheit}</span>
        </p>
      </figcaption>

      <svg
        viewBox={`0 0 ${B} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${strahl.label}: gemessen ${zahl(referenzwert, nachkomma)} in ${strahl.referenzperiode}, heute ${zahl(heute, nachkomma)} ${strahl.einheit}. Projektion siehe Tabelle im Detailteil.`}
      >
        <defs>
          <pattern id={`luecke-${strahl.indikator}`} width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#f8fafc" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#cbd5e1" strokeWidth="1.6" />
          </pattern>
        </defs>

        {/* Gitter und Werteachse */}
        {gitterwerte.map((w) => (
          <g key={w}>
            <line x1={RAND.links} y1={y(w)} x2={B - RAND.rechts} y2={y(w)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={RAND.links - 6} y={y(w) + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8">
              {zahl(w, w < 10 ? 1 : 0)}
            </text>
          </g>
        ))}

        {/* Datenlücke — bewusst sichtbar, statt die Linie durchzuziehen */}
        {strahl.luecke && (
          <g>
            <rect
              x={x(strahl.luecke.von)}
              y={RAND.oben}
              width={x(strahl.luecke.bis + 1) - x(strahl.luecke.von)}
              height={H - RAND.oben - RAND.unten}
              fill={`url(#luecke-${strahl.indikator})`}
            />
            <text
              x={(x(strahl.luecke.von) + x(strahl.luecke.bis + 1)) / 2}
              y={RAND.oben + 11}
              textAnchor="middle"
              fontSize="9"
              fill="#64748b"
            >
              keine Daten
            </text>
          </g>
        )}

        {/* Projektionsfenster: je Fenster zwei Szenarien nebeneinander */}
        {strahl.projektion.map((p, i) => {
          const links = x(p.von);
          const breite = x(p.bis) - x(p.von);
          const halb = breite / 2;
          const versatz = p.szenario === "rcp85" ? halb : 0;
          const farbe = SZENARIO_FARBE[p.szenario] ?? "#64748b";
          const oben = p.oben ?? p.mitte;
          const unten = p.unten ?? p.mitte;
          return (
            <g key={`${p.szenario}-${p.von}-${i}`}>
              <rect
                x={links + versatz}
                y={y(oben)}
                width={Math.max(halb - 2, 3)}
                height={Math.max(y(unten) - y(oben), 2)}
                fill={farbe}
                opacity="0.18"
                rx="2"
              />
              <line
                x1={links + versatz}
                y1={y(p.mitte)}
                x2={links + versatz + Math.max(halb - 2, 3)}
                y2={y(p.mitte)}
                stroke={farbe}
                strokeWidth="2.5"
              />
            </g>
          );
        })}

        {/* Einzeljahre — die Streuung gehört ins Bild, sonst wirkt der Trend glatter als die Wirklichkeit */}
        {jahre.map((jahr, i) => {
          const w = m.werte[i];
          if (w == null) return null;
          return <circle key={jahr} cx={x(jahr)} cy={y(w)} r="1.7" fill="#64748b" opacity="0.45" />;
        })}

        {/* Gemessener Verlauf */}
        <path d={trendpfad} fill="none" stroke={MESSFARBE} strokeWidth="2.6" strokeLinejoin="round" />

        {/* Marke „heute" */}
        <line
          x1={x(m.letztes_jahr)}
          y1={RAND.oben}
          x2={x(m.letztes_jahr)}
          y2={H - RAND.unten}
          stroke={MESSFARBE}
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.5"
        />

        {/* Jahresachse */}
        <line x1={RAND.links} y1={H - RAND.unten} x2={B - RAND.rechts} y2={H - RAND.unten} stroke="#94a3b8" strokeWidth="1" />
        {jahresmarken.map((j) => (
          <text key={j} x={x(j)} y={H - RAND.unten + 14} textAnchor="middle" fontSize="10" fill="#64748b">
            {j}
          </text>
        ))}
      </svg>

      <Legende szenarien={[...new Set(strahl.projektion.map((p) => p.szenario))]} />

      {strahl.einordnung_messung && (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200">
          <strong className="text-brand">Was das heißt: </strong>
          {strahl.einordnung_messung.text}
        </p>
      )}
    </figure>
  );
}

function Etappe({ titel, wert, betont = false }: { titel: string; wert: string; betont?: boolean }) {
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className={betont ? "text-lg font-bold text-brand" : "text-lg font-semibold text-slate-700"}>{wert}</span>
      <span className="text-[11px] text-slate-500">{titel}</span>
    </span>
  );
}

function Legende({ szenarien }: { szenarien: string[] }) {
  return (
    <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
      <li className="flex items-center gap-1.5">
        <svg width="18" height="8" aria-hidden>
          <line x1="0" y1="4" x2="18" y2="4" stroke={MESSFARBE} strokeWidth="2.6" />
        </svg>
        gemessen (Mittel über elf Jahre)
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="10" height="8" aria-hidden>
          <circle cx="5" cy="4" r="1.8" fill="#64748b" opacity="0.5" />
        </svg>
        einzelnes Jahr
      </li>
      {szenarien.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <svg width="18" height="10" aria-hidden>
            <rect x="0" y="1" width="18" height="8" fill={SZENARIO_FARBE[s] ?? "#64748b"} opacity="0.18" rx="2" />
            <line x1="0" y1="5" x2="18" y2="5" stroke={SZENARIO_FARBE[s] ?? "#64748b"} strokeWidth="2.5" />
          </svg>
          {SZENARIO_NAME[s] ?? s}
        </li>
      ))}
    </ul>
  );
}
