/**
 * Zeitstrahl einer Kennzahl — gemessene Vergangenheit und Modellspannen.
 *
 * Die erste Fassung zeichnete die Modellbandbreiten als gefüllte Rechtecke.
 * Bei den Eistagen reicht die veröffentlichte Spanne bis null; daraus wurde ein
 * Klotz vom Nullpunkt bis zur halben Bildhöhe, dreißig Jahre breit, der alles
 * andere erschlug. Die Rückmeldung war eindeutig: „Das werden die DMOs so nicht
 * verstehen."
 *
 * Vier Entwürfe wurden gegeneinander bewertet — von einer Geschäftsführerin auf
 * Zehn-Sekunden-Lesbarkeit, von einer Fachgutachterin auf Redlichkeit, von der
 * Entwicklung auf Baubarkeit. Was hier steht, ist die Schnittmenge dessen,
 * worauf alle drei kamen:
 *
 * * SPANNEN ALS STRICH MIT ENDKAPPEN, nie als Fläche. Dieselbe Information ohne
 *   das visuelle Gewicht, das ihr nicht zusteht — und ohne zu suggerieren, alle
 *   Werte innerhalb der Spanne seien gleich wahrscheinlich.
 * * ZWEI MESSLATTEN durch das ganze Bild: die Referenzperiode und das heutige
 *   Jahrzehnt. Jede ist nur über ihren eigenen Jahren fett und sonst dünn
 *   gepunktet — man sieht der Linie an, woher sie stammt. Das schließt zugleich
 *   die Lücke, die das Elf-Jahres-Mittel an seinem Ende lässt.
 * * VERBUNDEN WIRD NUR innerhalb derselben Quelle UND desselben Szenarios.
 *   Alles andere wäre eine erfundene Bahn durch Punkte, die nichts miteinander
 *   zu tun haben.
 * * VIER FARBFREIE KANÄLE: Symbolform sagt das Szenario, Strichart die Herkunft,
 *   die Fensterleiste unter der Achse den Zeitraum. Der Schwarzweißdruck ist
 *   damit der Normalfall und keine Prüfdisziplin.
 * * DIE EINZELJAHRE AUF DERSELBEN ACHSE. Nur so ist ablesbar, dass die
 *   Schwankung einzelner Winter größer ist als die gesamte Modellspanne.
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
};

export type ReferenzlinieT = {
  label: string;
  wert: number;
  von: number;
  bis: number;
  art: string;
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
  referenzlinien?: ReferenzlinieT[];
  messung: {
    jahre: number[];
    werte: (number | null)[];
    trend: (number | null)[];
    perioden: Record<string, number>;
    extremjahre: { jahr: number; wert: number }[];
    letztes_jahr: number;
    trend_endet?: number | null;
    mittel_letzte_zehn: number;
  };
  projektion: ProjektionsfensterT[];
};

const SZENARIO_NAME: Record<string, string> = {
  rcp45: "gedämpftes Szenario",
  rcp85: "hohes Szenario",
};

const MESSFARBE = "#14532d";
const MODELLFARBE = "#334155";

const B = 760;
const H = 300;
const RAND = { links: 44, rechts: 108, oben: 26, unten: 56 };

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
  const jahrBis = Math.max(m.letztes_jahr, ...strahl.projektion.map((p) => p.bis), m.letztes_jahr + 5);

  const x = (jahr: number) =>
    RAND.links + ((jahr - jahrVon) / (jahrBis - jahrVon)) * (B - RAND.links - RAND.rechts);
  const y = (wert: number) => RAND.oben + (1 - wert / obergrenze) * (H - RAND.oben - RAND.unten);

  const trendpfad = jahre
    .map((jahr, i) => ({ jahr, wert: m.trend[i] }))
    .filter((p): p is { jahr: number; wert: number } => p.wert != null)
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.jahr).toFixed(1)},${y(p.wert).toFixed(1)}`)
    .join(" ");

  const nachkomma = obergrenze < 20 ? 1 : 0;
  const gitter = [0, 0.25, 0.5, 0.75, 1].map((f) => f * obergrenze);
  const spanne = jahrBis - jahrVon;
  const marken = [1960, 1980, 2000, 2020, 2040, 2060, 2080, 2100].filter(
    (j) => j >= jahrVon && j <= jahrBis,
  );

  // Marker, die sich dieselbe Zeitraummitte teilen, versetzt zeichnen — und den
  // Versatz durch eine feine Führungslinie zurück auf die echte Mitte ehrlich
  // machen. Die Fenster 2036–2065 und 2041–2060 haben exakt dieselbe Mitte.
  const marker = strahl.projektion.map((p) => ({ p, mitte: (p.von + p.bis) / 2 }));
  const gruppen = new Map<number, typeof marker>();
  for (const eintrag of marker) {
    const schluessel = Math.round(eintrag.mitte / 6) * 6;
    gruppen.set(schluessel, [...(gruppen.get(schluessel) ?? []), eintrag]);
  }
  const platziert = [...gruppen.values()].flatMap((gruppe) => {
    const sortiert = [...gruppe].sort(
      (a, b) =>
        Number(b.p.eigenrechnung) - Number(a.p.eigenrechnung) ||
        a.p.szenario.localeCompare(b.p.szenario),
    );
    const breite = 13;
    return sortiert.map((eintrag, i) => ({
      ...eintrag,
      cx: x(eintrag.mitte) + (i - (sortiert.length - 1) / 2) * breite,
    }));
  });

  // Verbindungen ausschließlich innerhalb derselben Quelle UND desselben
  // Szenarios: sonst entstünde eine Bahn durch Punkte, die nichts verbindet.
  const reihen = new Map<string, typeof platziert>();
  for (const eintrag of platziert) {
    const key = `${eintrag.p.quelle_id}|${eintrag.p.szenario}`;
    reihen.set(key, [...(reihen.get(key) ?? []), eintrag]);
  }

  const k = strahl.kernaussagen ?? {};
  const linien = strahl.referenzlinien ?? [];
  const fenster = [...new Map(strahl.projektion.map((p) => [`${p.von}-${p.bis}-${p.eigenrechnung}`, p])).values()];

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

      <svg
        viewBox={`0 0 ${B} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={[k.bereits, k.richtung, k.hoehe].filter(Boolean).join(" ")}
      >
        {/* Gitter und Werteachse */}
        {gitter.map((w) => (
          <g key={w}>
            <line x1={RAND.links} y1={y(w)} x2={B - RAND.rechts} y2={y(w)} stroke="#e9edf2" strokeWidth="1" />
            <text x={RAND.links - 6} y={y(w) + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8">
              {zahl(w, nachkomma)}
            </text>
          </g>
        ))}

        {/* Trennung gemessen / modelliert */}
        <line
          x1={x(m.letztes_jahr)} y1={RAND.oben - 12} x2={x(m.letztes_jahr)} y2={H - RAND.unten}
          stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3"
        />
        <text x={x(m.letztes_jahr) - 8} y={RAND.oben - 15} textAnchor="end" fontSize="9.5"
              fill="#64748b" letterSpacing="0.08em">GEMESSEN</text>
        <text x={x(m.letztes_jahr) + 8} y={RAND.oben - 15} textAnchor="start" fontSize="9.5"
              fill="#64748b" letterSpacing="0.08em">MODELLIERT</text>

        {/* Datenlücke, falls es sie gibt */}
        {strahl.luecke && (
          <>
            <rect
              x={x(strahl.luecke.von)} y={RAND.oben}
              width={Math.max(x(strahl.luecke.bis + 1) - x(strahl.luecke.von), 2)}
              height={H - RAND.oben - RAND.unten}
              fill="#f1f5f9"
            />
            <text
              x={(x(strahl.luecke.von) + x(strahl.luecke.bis + 1)) / 2} y={RAND.oben + 11}
              textAnchor="middle" fontSize="9" fill="#94a3b8"
            >
              keine Daten
            </text>
          </>
        )}

        {/* Messlatten: fett über ihren eigenen Jahren, sonst dünn gepunktet */}
        {linien.map((l) => (
          <g key={l.label}>
            <line x1={RAND.links} y1={y(l.wert)} x2={B - RAND.rechts} y2={y(l.wert)}
                  stroke={MESSFARBE} strokeWidth="1" strokeDasharray="1.5 3" opacity="0.55" />
            <line x1={x(Math.max(l.von, jahrVon))} y1={y(l.wert)} x2={x(l.bis)} y2={y(l.wert)}
                  stroke={MESSFARBE} strokeWidth={l.art === "heute" ? 3.5 : 2.5} />
            <text x={B - RAND.rechts + 6} y={y(l.wert) - 2} fontSize="10" fill={MESSFARBE} fontWeight="600">
              {l.art === "heute" ? "heute" : "früher"} {zahl(l.wert, nachkomma)}
            </text>
            <text x={B - RAND.rechts + 6} y={y(l.wert) + 10} fontSize="9" fill="#94a3b8">
              {l.art === "heute" ? `${l.von}–${l.bis}` : l.label}
            </text>
          </g>
        ))}

        {/* Einzeljahre auf derselben Achse — die Streuung gehört ins Bild */}
        {jahre.map((jahr, i) => {
          const w = m.werte[i];
          if (w == null) return null;
          return <circle key={jahr} cx={x(jahr)} cy={y(w)} r="1.7" fill="#94a3b8" opacity="0.55" />;
        })}

        <path d={trendpfad} fill="none" stroke={MESSFARBE} strokeWidth="2.6" strokeLinejoin="round" />

        {/* Verbindungen je Modellreihe */}
        {[...reihen.entries()].map(([key, punkte]) => {
          if (punkte.length < 2) return null;
          const sortiert = [...punkte].sort((a, b) => a.mitte - b.mitte);
          const d = sortiert
            .map((e, i) => `${i === 0 ? "M" : "L"}${e.cx.toFixed(1)},${y(e.p.mitte).toFixed(1)}`)
            .join(" ");
          return (
            <path key={key} d={d} fill="none" stroke={MODELLFARBE} strokeWidth="1"
                  strokeDasharray={sortiert[0].p.eigenrechnung ? undefined : "3 2.5"} opacity="0.45" />
          );
        })}

        {/* Spannen als Strich mit Endkappen */}
        {platziert.map(({ p, cx, mitte }, i) => {
          const oben = p.oben ?? p.mitte;
          const unten = p.unten ?? p.mitte;
          const gestrichelt = !p.eigenrechnung;
          const hohl = p.szenario === "rcp85";
          // Sitzt die Untergrenze auf der Null, kann sie ein abgeschnittener
          // Wert sein — dann keine glatte Kappe, sondern ein offener Keil.
          const amBoden = unten <= 0.001;
          return (
            <g key={`${p.quelle_id}-${p.szenario}-${p.von}-${i}`}>
              {Math.abs(cx - x(mitte)) > 1 && (
                <line x1={cx} y1={y(unten) + 4} x2={x(mitte)} y2={H - RAND.unten}
                      stroke="#cbd5e1" strokeWidth="0.7" />
              )}
              <line x1={cx} y1={y(oben)} x2={cx} y2={y(unten)} stroke={MODELLFARBE}
                    strokeWidth="1.5" strokeDasharray={gestrichelt ? "3 2.5" : undefined} />
              <line x1={cx - 4.5} y1={y(oben)} x2={cx + 4.5} y2={y(oben)}
                    stroke={MODELLFARBE} strokeWidth="1.5" />
              {amBoden ? (
                <path d={`M${cx - 4.5},${y(unten) - 5} L${cx},${y(unten)} L${cx + 4.5},${y(unten) - 5}`}
                      fill="none" stroke={MODELLFARBE} strokeWidth="1.5" />
              ) : (
                <line x1={cx - 4.5} y1={y(unten)} x2={cx + 4.5} y2={y(unten)}
                      stroke={MODELLFARBE} strokeWidth="1.5" />
              )}
              <circle cx={cx} cy={y(p.mitte)} r="3.6" fill={hohl ? "#ffffff" : MODELLFARBE}
                      stroke={MODELLFARBE} strokeWidth="1.8" />
            </g>
          );
        })}

        {/* Zeitachse */}
        <line x1={RAND.links} y1={H - RAND.unten} x2={B - RAND.rechts} y2={H - RAND.unten}
              stroke="#94a3b8" strokeWidth="1" />
        {marken.map((j) => (
          <text key={j} x={x(j)} y={H - RAND.unten + 13} textAnchor="middle" fontSize="10" fill="#64748b">
            {j}
          </text>
        ))}

        {/* Fensterleiste: jedes Fenster an seiner echten Ausdehnung. Damit ist
            abzählbar, dass 2041–2060 vollständig in 2036–2065 liegt. */}
        {fenster.map((f, i) => {
          const zeile = f.eigenrechnung ? 0 : 1;
          const yy = H - RAND.unten + 22 + zeile * 9;
          return (
            <line key={`${f.von}-${f.bis}-${i}`} x1={x(f.von)} y1={yy} x2={x(f.bis)} y2={yy}
                  stroke={MODELLFARBE} strokeWidth="3.5" opacity={f.eigenrechnung ? 0.85 : 0.4}
                  strokeDasharray={f.eigenrechnung ? undefined : "4 3"} />
          );
        })}
        {fenster.length > 0 && (
          <>
            <text x={RAND.links} y={H - RAND.unten + 25} fontSize="8.5" fill="#94a3b8">eigene Auszählung</text>
            <text x={RAND.links} y={H - RAND.unten + 34} fontSize="8.5" fill="#94a3b8">veröffentlicht</text>
          </>
        )}
      </svg>

      <Legende mitEigen={strahl.projektion.some((p) => p.eigenrechnung)}
               mitVeroeffentlicht={strahl.projektion.some((p) => !p.eigenrechnung)}
               szenarien={[...new Set(strahl.projektion.map((p) => p.szenario))]} />

      {k.modellversatz && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 ring-1 ring-amber-200">
          {k.modellversatz}
        </p>
      )}

      {strahl.einordnung_messung && (
        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200">
          <strong className="text-brand">Was das heißt: </strong>
          {strahl.einordnung_messung.text}
        </p>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        {strahl.hinweis_messung} {strahl.hinweis_projektion} Die Modellspannen gelten für Mehrjahresmittel,
        nicht für einzelne Jahre — die grauen Punkte zeigen, wie weit einzelne Jahre davon abweichen.
      </p>
    </figure>
  );
}

function Legende({
  mitEigen,
  mitVeroeffentlicht,
  szenarien,
}: {
  mitEigen: boolean;
  mitVeroeffentlicht: boolean;
  szenarien: string[];
}) {
  return (
    <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
      <li className="flex items-center gap-1.5">
        <svg width="18" height="8" aria-hidden>
          <line x1="0" y1="4" x2="18" y2="4" stroke={MESSFARBE} strokeWidth="2.6" />
        </svg>
        gemessen, Mittel über elf Jahre
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="10" height="8" aria-hidden>
          <circle cx="5" cy="4" r="1.8" fill="#94a3b8" opacity="0.6" />
        </svg>
        einzelnes Jahr
      </li>
      {szenarien.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <svg width="12" height="12" aria-hidden>
            <circle cx="6" cy="6" r="3.6" fill={s === "rcp85" ? "#ffffff" : MODELLFARBE}
                    stroke={MODELLFARBE} strokeWidth="1.8" />
          </svg>
          {SZENARIO_NAME[s] ?? s}
        </li>
      ))}
      {mitVeroeffentlicht && (
        <li className="flex items-center gap-1.5">
          <svg width="18" height="10" aria-hidden>
            <line x1="9" y1="0" x2="9" y2="10" stroke={MODELLFARBE} strokeWidth="1.5" strokeDasharray="3 2.5" />
            <line x1="4.5" y1="0" x2="13.5" y2="0" stroke={MODELLFARBE} strokeWidth="1.5" />
            <line x1="4.5" y1="10" x2="13.5" y2="10" stroke={MODELLFARBE} strokeWidth="1.5" />
          </svg>
          gestrichelt: veröffentlichte Projektion
        </li>
      )}
      {mitEigen && (
        <li className="flex items-center gap-1.5">
          <svg width="18" height="10" aria-hidden>
            <line x1="9" y1="0" x2="9" y2="10" stroke={MODELLFARBE} strokeWidth="1.5" />
            <line x1="4.5" y1="0" x2="13.5" y2="0" stroke={MODELLFARBE} strokeWidth="1.5" />
            <line x1="4.5" y1="10" x2="13.5" y2="10" stroke={MODELLFARBE} strokeWidth="1.5" />
          </svg>
          durchgezogen: eigene Auszählung
        </li>
      )}
      <li className="text-slate-500">Strich = Spanne der Modelle, Punkt = Mittelwert</li>
    </ul>
  );
}
