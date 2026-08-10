/**
 * Zeitstrahl einer Kennzahl: die gemessene Linie und ihre möglichen Fortsetzungen.
 *
 * Dieselbe Form wie der Prognose-Fächer im Prognose-Labor: eine Linie je
 * Szenario, dahinter der Korridor als Fläche. Zwei Vorgänger-Fassungen sind an
 * derselben Klippe gescheitert — gefüllte Rechtecke je Zeitfenster, dann
 * Spannweitenbalken. Beide zeigten Kästen neben einer Kurve, keine Entwicklung.
 *
 * DER ANKERPUNKT IST DIE HEIKLE STELLE. Im Prognose-Labor setzt der Fächer am
 * letzten Ist-Wert an — dort startet die Prognose ja auch dort. Eine
 * Klimaprojektion tut das nicht: Sie gibt ihre Änderung gegenüber IHRER eigenen
 * Bezugsperiode an. Zeichnet man sie trotzdem vom heutigen Messwert aus, zeigt
 * die Kurve bei den Sommertagen einen Rückgang — obwohl jedes einzelne Modell
 * einen Anstieg rechnet. Der Fächer setzt deshalb an der Mitte der jeweiligen
 * Bezugsperiode an, auf unserem dort gemessenen Niveau.
 *
 * Dass die grüne Messkurve über dem Modellkorridor verläuft, ist damit kein
 * Zeichenfehler, sondern der Befund: Die Beobachtung ist der Projektion
 * vorausgeeilt. Genau das sagt auch der Satz unter der Grafik.
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
  eigenrechnung?: boolean;
  bezugsperiode?: string | null;
  anker_jahr?: number | null;
  anker_wert?: number | null;
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
  kernaussagen?: {
    bereits?: string;
    richtung?: string;
    hoehe?: string;
    selbst_obergrenze?: string;
    modellversatz?: string;
  };
  messung: {
    jahre: number[];
    werte: (number | null)[];
    trend: (number | null)[];
    perioden: Record<string, number>;
    letztes_jahr: number;
    trend_endet?: number | null;
    mittel_letzte_zehn: number;
  };
  projektion: ProjektionsfensterT[];
};

const SZENARIO = {
  rcp45: { name: "gedämpftes Szenario", farbe: "#0284c7" },
  rcp85: { name: "hohes Szenario", farbe: "#dc2626" },
} as const;

const MESSFARBE = "#14532d";

const B = 760;
const H = 280;
const RAND = { links: 44, rechts: 96, oben: 24, unten: 34 };

const farbe = (szenario: string) =>
  (SZENARIO as Record<string, { farbe: string }>)[szenario]?.farbe ?? "#64748b";
const name = (szenario: string) =>
  (SZENARIO as Record<string, { name: string }>)[szenario]?.name ?? szenario;

function zahl(n: number | null | undefined, stellen = 0): string {
  if (n == null || Number.isNaN(n)) return "–";
  return n.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
}

export default function Zeitstrahl({ strahl }: { strahl: ZeitstrahlT }) {
  const m = strahl.messung;
  const jahre = m.jahre ?? [];
  if (jahre.length === 0) return null;

  const messwerte = m.werte.filter((w): w is number => w != null);
  const projwerte = strahl.projektion.flatMap((p) =>
    [p.mitte, p.unten, p.oben].filter((v): v is number => v != null),
  );
  const obergrenze = Math.max(...messwerte, ...projwerte, 1) * 1.06;
  const jahrVon = Math.min(...jahre);
  const jahrBis = Math.max(m.letztes_jahr + 5, ...strahl.projektion.map((p) => p.bis));

  const x = (jahr: number) =>
    RAND.links + ((jahr - jahrVon) / (jahrBis - jahrVon)) * (B - RAND.links - RAND.rechts);
  const y = (wert: number) => RAND.oben + (1 - wert / obergrenze) * (H - RAND.oben - RAND.unten);

  // Eine Kurve je Quelle und Szenario. Startpunkt ist der Anker der Quelle —
  // ohne ihn würde die Kurve im Bild schweben.
  const kurven = new Map<string, { szenario: string; eigen: boolean; punkte: ProjektionsfensterT[] }>();
  for (const p of strahl.projektion) {
    const key = `${p.quelle_id}|${p.szenario}`;
    const eintrag = kurven.get(key) ?? { szenario: p.szenario, eigen: !!p.eigenrechnung, punkte: [] };
    eintrag.punkte.push(p);
    kurven.set(key, eintrag);
  }

  const bahnen = [...kurven.entries()].map(([key, k]) => {
    const punkte = [...k.punkte].sort((a, b) => a.von - b.von);
    const start = punkte[0];
    const stuetzen = punkte.map((p) => ({
      jahr: (p.von + p.bis) / 2,
      mitte: p.mitte,
      oben: p.oben ?? p.mitte,
      unten: p.unten ?? p.mitte,
    }));
    // Am Anker ist der Korridor null breit — die Unsicherheit wächst mit dem
    // Abstand zur Bezugsperiode, genau wie in der Sache.
    if (start.anker_jahr != null && start.anker_wert != null) {
      stuetzen.unshift({
        jahr: start.anker_jahr, mitte: start.anker_wert,
        oben: start.anker_wert, unten: start.anker_wert,
      });
    }
    const linie = stuetzen
      .map((s, i) => `${i === 0 ? "M" : "L"}${x(s.jahr).toFixed(1)},${y(s.mitte).toFixed(1)}`)
      .join(" ");
    const korridor =
      stuetzen.map((s, i) => `${i === 0 ? "M" : "L"}${x(s.jahr).toFixed(1)},${y(s.oben).toFixed(1)}`).join(" ") +
      " " +
      [...stuetzen].reverse().map((s) => `L${x(s.jahr).toFixed(1)},${y(s.unten).toFixed(1)}`).join(" ") +
      " Z";
    return { key, szenario: k.szenario, eigen: k.eigen, linie, korridor, letzte: stuetzen[stuetzen.length - 1] };
  });

  const trendpfad = jahre
    .map((jahr, i) => ({ jahr, wert: m.trend[i] }))
    .filter((p): p is { jahr: number; wert: number } => p.wert != null)
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.jahr).toFixed(1)},${y(p.wert).toFixed(1)}`)
    .join(" ");
  const trendEnde = m.trend_endet ?? null;

  const nachkomma = obergrenze < 20 ? 1 : 0;
  const gitter = [0, 0.25, 0.5, 0.75, 1].map((f) => f * obergrenze);
  const marken = [1960, 1980, 2000, 2020, 2040, 2060, 2080, 2100].filter(
    (j) => j >= jahrVon && j <= jahrBis,
  );
  const k = strahl.kernaussagen ?? {};

  return (
    <figure className="mb-6 break-inside-avoid rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 print:shadow-none">
      <figcaption className="mb-3">
        <h4 className="text-base font-semibold text-brand">{strahl.label}</h4>
        {k.bereits && <p className="mt-1 text-lg font-bold leading-snug text-brand">{k.bereits}</p>}
        <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {k.richtung && (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Richtung — belastbar
              </dt>
              <dd className="text-slate-700">{k.richtung}</dd>
            </div>
          )}
          {k.hoehe && (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Ausmaß — unsicher
              </dt>
              <dd className="text-slate-700">
                {k.hoehe}
                {k.selbst_obergrenze && <> {k.selbst_obergrenze}</>}
              </dd>
            </div>
          )}
        </dl>
      </figcaption>

      <svg viewBox={`0 0 ${B} ${H}`} className="h-auto w-full" role="img"
           aria-label={[k.bereits, k.richtung, k.hoehe].filter(Boolean).join(" ")}>
        {gitter.map((w) => (
          <g key={w}>
            <line x1={RAND.links} y1={y(w)} x2={B - RAND.rechts} y2={y(w)} stroke="#eef1f5" strokeWidth="1" />
            <text x={RAND.links - 6} y={y(w) + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8">
              {zahl(w, nachkomma)}
            </text>
          </g>
        ))}

        {strahl.luecke && (
          <rect x={x(strahl.luecke.von)} y={RAND.oben}
                width={Math.max(x(strahl.luecke.bis + 1) - x(strahl.luecke.von), 2)}
                height={H - RAND.oben - RAND.unten} fill="#f1f5f9" />
        )}

        {/* Korridore zuerst, damit die Linien darüber liegen */}
        {bahnen.map((b) => (
          <path key={`${b.key}-korridor`} d={b.korridor} fill={farbe(b.szenario)} opacity="0.13" />
        ))}
        {bahnen.map((b) => (
          <path key={`${b.key}-linie`} d={b.linie} fill="none" stroke={farbe(b.szenario)}
                strokeWidth="2.2" strokeLinejoin="round"
                strokeDasharray={b.eigen ? "5 3" : undefined} />
        ))}

        {/* Trennung gemessen / modelliert */}
        <line x1={x(m.letztes_jahr)} y1={RAND.oben} x2={x(m.letztes_jahr)} y2={H - RAND.unten}
              stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3" />
        <text x={x(m.letztes_jahr) - 6} y={RAND.oben + 9} textAnchor="end" fontSize="9"
              fill="#94a3b8" letterSpacing="0.06em">gemessen</text>
        <text x={x(m.letztes_jahr) + 6} y={RAND.oben + 9} textAnchor="start" fontSize="9"
              fill="#94a3b8" letterSpacing="0.06em">modelliert</text>

        {/* Einzeljahre: die Streuung gehört ins Bild, sonst wirkt der Trend glatter als die Wirklichkeit */}
        {jahre.map((jahr, i) => {
          const w = m.werte[i];
          if (w == null) return null;
          return <circle key={jahr} cx={x(jahr)} cy={y(w)} r="1.6" fill="#cbd5e1" />;
        })}

        <path d={trendpfad} fill="none" stroke={MESSFARBE} strokeWidth="2.8" strokeLinejoin="round" />
        {/* Anschluss bis zur Gegenwart: das Elf-Jahres-Fenster endet fünf Jahre
            früher, im Bild sah das aus wie fehlende Daten. */}
        {trendEnde != null && (
          <>
            <line x1={x(trendEnde)} y1={y(m.trend[jahre.indexOf(trendEnde)] ?? m.mittel_letzte_zehn)}
                  x2={x(m.letztes_jahr)} y2={y(m.mittel_letzte_zehn)}
                  stroke={MESSFARBE} strokeWidth="2" strokeDasharray="2 2.5" />
            <circle cx={x(m.letztes_jahr)} cy={y(m.mittel_letzte_zehn)} r="3.4"
                    fill="#ffffff" stroke={MESSFARBE} strokeWidth="2" />
          </>
        )}

        {/* Endwerte am rechten Rand beschriften — dort sucht das Auge die Aussage */}
        {bahnen.map((b) => (
          <text key={`${b.key}-wert`} x={B - RAND.rechts + 6} y={y(b.letzte.mitte) + 3.5}
                fontSize="10.5" fill={farbe(b.szenario)} fontWeight="600">
            {zahl(b.letzte.mitte, nachkomma)}
          </text>
        ))}
        <text x={B - RAND.rechts + 6} y={y(m.mittel_letzte_zehn) + 3.5} fontSize="10.5"
              fill={MESSFARBE} fontWeight="700">
          {zahl(m.mittel_letzte_zehn, nachkomma)}
        </text>
        <text x={B - RAND.rechts + 6} y={y(m.mittel_letzte_zehn) + 14} fontSize="9" fill="#94a3b8">
          heute
        </text>

        <line x1={RAND.links} y1={H - RAND.unten} x2={B - RAND.rechts} y2={H - RAND.unten}
              stroke="#cbd5e1" strokeWidth="1" />
        {marken.map((j) => (
          <text key={j} x={x(j)} y={H - RAND.unten + 14} textAnchor="middle" fontSize="10" fill="#94a3b8">
            {j}
          </text>
        ))}
      </svg>

      <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
        <li className="flex items-center gap-1.5">
          <svg width="18" height="8" aria-hidden>
            <line x1="0" y1="4" x2="18" y2="4" stroke={MESSFARBE} strokeWidth="2.8" />
          </svg>
          gemessen
        </li>
        {[...new Set(strahl.projektion.map((p) => p.szenario))].map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <svg width="18" height="10" aria-hidden>
              <rect x="0" y="1" width="18" height="8" fill={farbe(s)} opacity="0.13" />
              <line x1="0" y1="5" x2="18" y2="5" stroke={farbe(s)} strokeWidth="2.2" />
            </svg>
            {name(s)}
          </li>
        ))}
        <li className="text-slate-500">Fläche = Spanne der Modelle</li>
        {strahl.projektion.some((p) => p.eigenrechnung) && (
          <li className="text-slate-500">gestrichelt = eigene Auszählung aus Tagesdaten</li>
        )}
      </ul>

      {k.modellversatz && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{k.modellversatz}</p>
      )}

      {strahl.einordnung_messung && (
        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200">
          <strong className="text-brand">Was das heißt: </strong>
          {strahl.einordnung_messung.text}
        </p>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        {strahl.hinweis_messung} Die Modellkurven setzen an der Mitte ihrer jeweiligen Bezugsperiode
        an; der Korridor öffnet sich von dort. Die Spannen gelten für Mehrjahresmittel, nicht für
        einzelne Jahre — die grauen Punkte zeigen, wie weit einzelne Jahre davon abweichen.
      </p>
    </figure>
  );
}
