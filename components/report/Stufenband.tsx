/**
 * Die Entwicklung einer Saison-Kennzahl über die gerechneten Zeitfenster.
 *
 * WARUM KEINE KURVE. Es sind drei bis fünf Stützpunkte, jeder ein Mittel über
 * zwanzig Jahre. Eine Linie dazwischen erfindet Wendepunkte, die niemand
 * gerechnet hat, und lädt dazu ein, ein Jahr abzulesen, das gar nicht existiert.
 * Deshalb Plateaus — der Wert GILT über seine zwanzig Jahre — und gestrichelte
 * Verbinder, die nur die Zuordnung zeigen, nicht den Weg.
 *
 * WARUM KEINE JAHRESACHSE. Die Fenster überlappen sich teilweise (2036–2065
 * gegen 2041–2060) und wären auf einer echten Zeitachse nicht ordenbar; die
 * Riegel lägen physisch übereinander. Gleich breite Spalten machen das Problem
 * konstruktiv unmöglich. Der Preis ist, dass die Grafik nichts über
 * Geschwindigkeit sagt — deshalb steht der Tausch in der Bildunterschrift.
 *
 * WARUM DIE ERSTE SPALTE NICHT „HEUTE" HEISST. Sie ist die Bezugsperiode der
 * Quelle: bei GERICS 1971–2000, bei MTMSI das Modellmittel 1986–2005. Der
 * Zeitstrahl in Kapitel 1 rechnet die Modelländerung auf die GEMESSENE Reihe um
 * und darf deshalb „heute" sagen; hier gibt es für Schnee gar keine Messreihe.
 * Zwei optisch gleiche Grafiken mit zwei verschiedenen „heute" im selben Bericht
 * wären der leiseste und teuerste Fehler, den dieses Kapitel machen könnte.
 */
"use client";

import { einheitImSatz, SZENARIO_KURZ } from "@/lib/klartext";

export type VerlaufspunktT = {
  szenario: string;
  zeitfenster: string;
  von: number;
  bis: number;
  wert: number;
};

const FARBE: Record<string, string> = {
  rcp45: "#0284c7",
  rcp85: "#dc2626",
  rcp26: "#16a34a",
};
const BASISFARBE = "#334155";

const B = 680;
const H = 152;
// Unten stehen drei Zeilen übereinander: Spaltenname, Jahreszahlen, Herkunft.
// Mit 34 px klebten sie aufeinander.
const RAND = { links: 34, rechts: 40, oben: 16, unten: 52 };

const zahl = (n: number) =>
  n.toLocaleString("de-DE", { maximumFractionDigits: Math.abs(n) < 10 && n % 1 !== 0 ? 1 : 0 });

/** „2041-2060" → „Mitte des Jhd." — die Jahreszahlen stehen darunter. */
function spaltenname(von: number, bis: number): string {
  const mitte = (von + bis) / 2;
  if (mitte < 2020) return "Modellbasis";
  if (mitte < 2035) return "nächste Jahre";
  if (mitte < 2060) return "Mitte des Jhd.";
  if (mitte < 2080) return "2. Jhd.-Hälfte";
  return "Ende des Jhd.";
}

export default function Stufenband({
  verlauf,
  basis,
  basisFenster,
  einheit,
  quelle,
}: {
  verlauf: VerlaufspunktT[];
  basis: number;
  basisFenster?: string;
  einheit: string;
  quelle?: string;
}) {
  // Ohne mindestens zwei gerechnete Fenster gibt es keine Entwicklung zu zeigen —
  // dann steht der Satz allein, und das ist ehrlicher als ein Bild mit zwei Balken.
  const fenster = [...new Set(verlauf.map((p) => p.zeitfenster))].sort(
    (a, b) => (verlauf.find((p) => p.zeitfenster === a)?.von ?? 0) -
              (verlauf.find((p) => p.zeitfenster === b)?.von ?? 0),
  );
  if (fenster.length < 2) return null;

  const szenarien = [...new Set(verlauf.map((p) => p.szenario))].sort();
  const spalten = [{ id: "basis", von: 0, bis: 0 }, ...fenster.map((f) => {
    const p = verlauf.find((x) => x.zeitfenster === f)!;
    return { id: f, von: p.von, bis: p.bis };
  })];

  const werte = [basis, ...verlauf.map((p) => p.wert)];
  const max = Math.max(...werte, 1) * 1.12;
  const flaeche = { x: B - RAND.links - RAND.rechts, y: H - RAND.oben - RAND.unten };
  const y = (v: number) => RAND.oben + (1 - v / max) * flaeche.y;
  const breite = flaeche.x / spalten.length;
  const mitteVon = (i: number) => RAND.links + breite * (i + 0.5);
  const halb = Math.min(breite * 0.34, 46);

  // Ein Wert von 0 verschwindet sonst in der Achse — und genau er ist bei
  // Schnee der wichtigste Befund der ganzen Karte.
  const yPlateau = (v: number) => Math.min(y(v), y(0) - 1.6);

  type Marke = { x: number; y: number; text: string; farbe: string };
  const marken: Marke[] = [
    { x: mitteVon(0) + halb + 4, y: yPlateau(basis), text: zahl(basis), farbe: BASISFARBE },
  ];
  fenster.forEach((f, i) => {
    const inSpalte = verlauf
      .filter((p) => p.zeitfenster === f)
      .sort((a, b) => b.wert - a.wert);
    let letztes = -Infinity;
    const beschriftet = new Set<string>();
    for (const p of inSpalte) {
      // Liegen zwei Szenarien auf demselben Wert, ist die zweite Beschriftung
      // keine Information, sondern eine Dopplung — "0 / 0" untereinander sieht
      // aus wie ein Fehler. Dann steht die Zahl einmal in neutralem Grau.
      const text = zahl(p.wert);
      if (beschriftet.has(text)) continue;
      const doppelt = inSpalte.filter((q) => zahl(q.wert) === text).length > 1;
      beschriftet.add(text);
      // Beschriftungen auseinanderziehen, sonst kleben 75 und 67 übereinander.
      const platz = Math.max(yPlateau(p.wert) + 3.5, letztes + 12);
      letztes = platz;
      marken.push({
        x: mitteVon(i + 1) + halb + 4,
        y: platz,
        text,
        farbe: doppelt ? BASISFARBE : (FARBE[p.szenario] ?? BASISFARBE),
      });
    }
  });

  const bezug = basisFenster ? `Bezug ${basisFenster.replace("-", "–")}` : "Bezugsperiode der Quelle";
  const quelltext = [quelle ? `Quelle ${quelle.toUpperCase()}` : "", bezug]
    .filter(Boolean)
    .join(" · ");

  return (
    <figure className="my-3">
      <svg
        viewBox={`0 0 ${B} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Entwicklung über die gerechneten Zeiträume: ${bezug} ${zahl(basis)}, ` +
          verlauf.map((p) => `${p.zeitfenster} ${SZENARIO_KURZ[p.szenario] ?? p.szenario} ${zahl(p.wert)}`).join(", ")}
      >
        {/* Nulllinie und die Höhe der Bezugsperiode als stille Orientierung */}
        <line x1={RAND.links} x2={B - RAND.rechts} y1={y(0)} y2={y(0)}
              stroke="#cbd5e1" strokeWidth="1" />
        <line x1={RAND.links} x2={B - RAND.rechts} y1={y(basis)} y2={y(basis)}
              stroke="#e2e8f0" strokeDasharray="1 4" strokeWidth="1" />

        {/* Verbinder: gestrichelt, weil dazwischen nichts gerechnet ist */}
        {szenarien.map((szen) => {
          const kette = [
            { spalte: 0, wert: basis },
            ...fenster.map((f, i) => {
              const p = verlauf.find((x) => x.zeitfenster === f && x.szenario === szen);
              return p ? { spalte: i + 1, wert: p.wert } : null;
            }).filter((x): x is { spalte: number; wert: number } => x !== null),
          ];
          return kette.slice(1).map((punkt, i) => {
            const vor = kette[i];
            return (
              <line
                key={`${szen}-${i}`}
                x1={mitteVon(vor.spalte) + halb}
                y1={yPlateau(vor.wert)}
                x2={mitteVon(punkt.spalte) - halb}
                y2={yPlateau(punkt.wert)}
                stroke={FARBE[szen] ?? BASISFARBE}
                strokeDasharray="2 3"
                strokeWidth="1.3"
                opacity="0.5"
              />
            );
          });
        })}

        {/* Plateaus: der Wert gilt über sein ganzes Fenster */}
        <line x1={mitteVon(0) - halb} x2={mitteVon(0) + halb} y1={yPlateau(basis)} y2={yPlateau(basis)}
              stroke={BASISFARBE} strokeWidth="3.4" strokeLinecap="round" />
        {verlauf.map((p, i) => {
          const spalte = fenster.indexOf(p.zeitfenster) + 1;
          // Deckt ein Szenario das andere exakt, wird das obere gestrichelt —
          // sonst verschwindet es und der Leser sieht nur eine Linie.
          const verdeckt =
            verlauf.findIndex((q) => q.zeitfenster === p.zeitfenster && zahl(q.wert) === zahl(p.wert)) < i;
          return (
            <line
              key={`${p.szenario}-${p.zeitfenster}-${i}`}
              x1={mitteVon(spalte) - halb}
              x2={mitteVon(spalte) + halb}
              y1={yPlateau(p.wert)}
              y2={yPlateau(p.wert)}
              stroke={FARBE[p.szenario] ?? BASISFARBE}
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeDasharray={verdeckt ? "5 4" : undefined}
            />
          );
        })}

        {/* Weißer Rand hinter der Zahl: Die gestrichelten Verbinder laufen sonst
            mitten durch die Beschriftung. `paint-order` zeichnet die Kontur vor
            der Füllung — in einer Grafik ohne Bibliothek der billigste Weg. */}
        {marken.map((m, i) => (
          <text key={i} x={m.x} y={m.y} fontSize="11" fontWeight="700" fill={m.farbe}
                stroke="#ffffff" strokeWidth="3.5" paintOrder="stroke" strokeLinejoin="round">
            {m.text}
          </text>
        ))}

        {/* Spaltenköpfe: Einordnung oben, Jahreszahlen darunter */}
        {spalten.map((s, i) => (
          <g key={s.id}>
            <text x={mitteVon(i)} y={H - RAND.unten + 15} textAnchor="middle"
                  fontSize="10.5" fill="#475569">
              {i === 0 ? "Modellbasis" : spaltenname(s.von, s.bis)}
            </text>
            <text x={mitteVon(i)} y={H - RAND.unten + 27} textAnchor="middle"
                  fontSize="9.5" fill="#94a3b8">
              {i === 0 ? (basisFenster ?? "").replace("-", "–") : `${s.von}–${s.bis}`}
            </text>
          </g>
        ))}

        {/* Herkunft und der Tausch, den die Form macht — als SVG-Text, nicht als
            HTML-Bildunterschrift: Wer die Grafik herauskopiert oder teilt, nimmt
            das Kleingedruckte sonst nicht mit. */}
        <text x={RAND.links} y={H - 6} fontSize="8.5" fill="#94a3b8">
          {quelltext} · gleich breite Spalten, kein Zeitmaßstab · Mittel über je 20 Jahre
        </text>
        <text x={B - RAND.rechts} y={RAND.oben - 3} textAnchor="end" fontSize="9.5" fill="#94a3b8">
          {einheitImSatz(einheit)}
        </text>
      </svg>

      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-5 rounded" style={{ background: BASISFARBE }} />
          Bezugsperiode der Quelle
        </li>
        {szenarien.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span className="inline-block h-[3px] w-5 rounded" style={{ background: FARBE[s] ?? BASISFARBE }} />
            {SZENARIO_KURZ[s] ?? s}
          </li>
        ))}
        <li className="text-slate-400">gestrichelt = dazwischen ist nichts gerechnet</li>
      </ul>
    </figure>
  );
}
