/**
 * „Wo trifft der Klimawandel Ihre Saison?" — in drei nachvollziehbaren Schritten.
 *
 * Die Kernaussage des Kapitels stand bisher als fertige Prozentzahl da; wie sie
 * zustande kommt, war nicht zu sehen. Hier wird derselbe Rechenweg zur Bildfolge:
 *
 *   1. Ihre Saison        — wann kommen die Gäste?
 *   2. Die Klimaänderung  — welche Monate verändern sich?
 *   3. Die Überlagerung   — dieselben Balken, eingefärbt nach Schritt 2.
 *
 * Schritt 3 zeigt bewusst wieder die Balken aus Schritt 1: so ist sichtbar, dass
 * nichts hinzugerechnet wird, sondern nur eingefärbt.
 */
"use client";

import type { MatrixT } from "./Monatsmatrix";

export type ExpositionsmonatT = {
  monat: number;
  name: string;
  anteil: number;
  delta: number;
  delta_relativ: number;
  referenz: number;
  zukunft: number;
  richtung: "chance" | "risiko" | "neutral";
  richtung_label: string;
  exponierter_anteil: number;
  verfuegbar: boolean;
};

/**
 * Dieselbe Verschneidung, die `Monatsmatrix` als Tabelle zeigt — nur mit den
 * Feldern, die die Monatsrechnung zusätzlich mitliefert. Bewusst als Erweiterung
 * von `MatrixT` deklariert, damit derselbe Eintrag ohne Umweg in beiden
 * Darstellungen verwendet werden kann.
 */
export type VerschneidungT = Omit<MatrixT, "monate" | "summe"> & {
  indikator: string;
  quelle_id: string;
  validitaet: string;
  hoeher_ist_besser: boolean;
  monate: ExpositionsmonatT[];
  summe: {
    bezug: string;
    monate_chance: string[];
    monate_risiko: string[];
    exponierter_anteil_chance: number;
    exponierter_anteil_risiko: number;
    exponierte_naechte_chance: number;
    exponierte_naechte_risiko: number;
  };
};

const FARBE = { chance: "#0284c7", risiko: "#ea580c", neutral: "#cbd5e1" } as const;
const SZENARIO_TEXT: Record<string, string> = {
  rcp45: "im gedämpften Pfad (RCP4.5)",
  rcp85: "im Hochemissionspfad (RCP8.5)",
};

const prozent = (a: number) => `${(a * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`;
const naechte = (n: number) => n.toLocaleString("de-DE");

function aufzaehlung(namen: string[]): string {
  if (namen.length === 0) return "";
  if (namen.length === 1) return namen[0];
  return `${namen.slice(0, -1).join(", ")} und ${namen[namen.length - 1]}`;
}

export default function HerleitungDrei({ v }: { v: VerschneidungT }) {
  const monate = v.monate ?? [];
  if (monate.length === 0) return null;

  const maxAnteil = Math.max(...monate.map((m) => m.anteil), 0.001);
  const maxDelta = Math.max(...monate.map((m) => Math.abs(m.delta)), 0.001);

  const spitzen = [...monate].sort((a, b) => b.anteil - a.anteil).slice(0, 3);
  const spitzenAnteil = spitzen.reduce((s, m) => s + m.anteil, 0);
  const spitzenNamen = new Set(spitzen.map((m) => m.name));

  const betroffen = monate.filter((m) => m.richtung !== "neutral");
  const staerkste = [...betroffen].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  const anteilGesamt = v.summe.exponierter_anteil_chance + v.summe.exponierter_anteil_risiko;
  const naechteGesamt = v.summe.exponierte_naechte_chance + v.summe.exponierte_naechte_risiko;

  const nachkomma = Math.abs(maxDelta) < 5 ? 1 : 0;
  const dz = (n: number) =>
    `${n > 0 ? "+" : ""}${n.toLocaleString("de-DE", { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma })}`;

  return (
    <section className="mb-6 break-inside-avoid rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 print:shadow-none">
      <header className="mb-4 border-b border-slate-100 pb-3">
        <h4 className="text-base font-semibold text-brand">{v.indikator_label}</h4>
        <p className="text-xs text-slate-500">
          {SZENARIO_TEXT[v.szenario] ?? v.szenario}, Zeitraum {v.zeitfenster} · Aussagekraft {v.validitaet}
        </p>
      </header>

      <Schritt
        nummer={1}
        titel="Ihre Saison"
        satz={
          <>
            Ihr Geschäft konzentriert sich auf {aufzaehlung(spitzen.map((m) => m.name))} — dort fallen{" "}
            <strong>{prozent(spitzenAnteil)}</strong> aller Übernachtungen an.
          </>
        }
      >
        <Balken
          monate={monate}
          hoehe={(m) => m.anteil / maxAnteil}
          farbe={(m) => (spitzenNamen.has(m.name) ? "#15803d" : "#86efac")}
          titel={(m) => `${m.name}: ${prozent(m.anteil)} der Übernachtungen`}
        />
      </Schritt>

      <Schritt
        nummer={2}
        titel="Die Klimaänderung"
        satz={
          betroffen.length === 0 ? (
            <>
              In keinem Monat überschreitet die Änderung von {v.indikator_label.toLowerCase()} die
              Auffälligkeitsschwelle. Das Kapitel meldet für diese Kennzahl also gerade keine
              Exposition — kein fehlender Wert, sondern ein Ergebnis.
            </>
          ) : (
            <>
              Deutlich verändert sich {aufzaehlung(betroffen.map((m) => m.name))}
              {staerkste && (
                <>
                  , am stärksten der {staerkste.name} mit{" "}
                  <strong>
                    {dz(staerkste.delta)} {v.einheit}
                  </strong>{" "}
                  ({dz(staerkste.delta_relativ * 100)} %)
                </>
              )}
              .
            </>
          )
        }
      >
        <Divergenzbalken monate={monate} maxDelta={maxDelta} einheit={v.einheit} nachkomma={nachkomma} />
      </Schritt>

      <Schritt
        nummer={3}
        titel="Die Überlagerung"
        satz={
          <>
            Zusammengelegt liegen <strong>{prozent(anteilGesamt)}</strong> Ihrer Übernachtungen (
            {naechte(naechteGesamt)} Nächte) in Monaten, die sich deutlich verändern
            {v.summe.exponierter_anteil_risiko > 0 && v.summe.exponierter_anteil_chance > 0 ? (
              <>
                {" "}
                — {prozent(v.summe.exponierter_anteil_chance)} davon als Chance,{" "}
                {prozent(v.summe.exponierter_anteil_risiko)} als Risiko
              </>
            ) : v.summe.exponierter_anteil_risiko > 0 ? (
              <> — durchgängig als Risiko</>
            ) : v.summe.exponierter_anteil_chance > 0 ? (
              <> — durchgängig als Chance</>
            ) : null}
            . Das ist eine Aussage über Exposition, nicht über Buchungen.
          </>
        }
      >
        <Balken
          monate={monate}
          hoehe={(m) => m.anteil / maxAnteil}
          farbe={(m) => FARBE[m.richtung]}
          titel={(m) =>
            `${m.name}: ${prozent(m.anteil)} der Übernachtungen, ${m.richtung_label} (${dz(m.delta)} ${v.einheit})`
          }
        />
      </Schritt>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{v.schwellen_hinweis}</p>
    </section>
  );
}

function Schritt({
  nummer,
  titel,
  satz,
  children,
}: {
  nummer: number;
  titel: string;
  satz: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 grid gap-3 border-b border-slate-100 pb-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
      <div>
        <p className="mb-1 flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            {nummer}
          </span>
          <span className="text-sm font-semibold text-brand">{titel}</span>
        </p>
        <p className="text-sm leading-relaxed text-slate-700">{satz}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Balken({
  monate,
  hoehe,
  farbe,
  titel,
}: {
  monate: ExpositionsmonatT[];
  hoehe: (m: ExpositionsmonatT) => number;
  farbe: (m: ExpositionsmonatT) => string;
  titel: (m: ExpositionsmonatT) => string;
}) {
  return (
    <div className="flex items-end gap-[3px]" role="img" aria-label="Monatsverteilung">
      {monate.map((m) => (
        <div key={m.monat} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-20 w-full items-end">
            <div
              className="w-full rounded-t"
              style={{ height: `${Math.max(hoehe(m) * 100, 2)}%`, backgroundColor: farbe(m) }}
              title={titel(m)}
            />
          </div>
          <span className="text-[9px] text-slate-500">{m.name.slice(0, 3)}</span>
        </div>
      ))}
    </div>
  );
}

function Divergenzbalken({
  monate,
  maxDelta,
  einheit,
  nachkomma,
}: {
  monate: ExpositionsmonatT[];
  maxDelta: number;
  einheit: string;
  nachkomma: number;
}) {
  return (
    <div className="flex items-stretch gap-[3px]" role="img" aria-label="Änderung je Monat">
      {monate.map((m) => {
        const anteil = Math.min(Math.abs(m.delta) / maxDelta, 1);
        const positiv = m.delta >= 0;
        return (
          <div key={m.monat} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative h-20 w-full">
              {/* Nulllinie in der Mitte: nach oben Zunahme, nach unten Abnahme */}
              <div className="absolute left-0 top-1/2 h-px w-full bg-slate-300" />
              <div
                className="absolute left-0 w-full rounded-sm"
                style={{
                  height: `${Math.max(anteil * 50, 1.5)}%`,
                  backgroundColor: FARBE[m.richtung],
                  ...(positiv ? { bottom: "50%" } : { top: "50%" }),
                }}
                title={`${m.name}: ${m.delta > 0 ? "+" : ""}${m.delta.toFixed(nachkomma)} ${einheit} (${m.richtung_label})`}
              />
            </div>
            <span className="text-[9px] text-slate-500">{m.name.slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}
