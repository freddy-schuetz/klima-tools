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
import { aufzaehlung, monatsrolle, naechte, SZENARIO_SATZ, zeitraumLage } from "@/lib/klartext";

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
    // Nur gesetzt, wenn belastbare Jahresuebernachtungen vorliegen.
    exponierte_naechte_chance: number | null;
    exponierte_naechte_risiko: number | null;
  };
};

const FARBE = { chance: "#0284c7", risiko: "#ea580c", neutral: "#cbd5e1" } as const;

const prozent = (a: number) => `${Math.round(a * 100)} %`;

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
  // Die Naechte-Zahlen fehlen, wenn keine belastbaren Jahresuebernachtungen
  // vorliegen. Ohne diese Pruefung stand woertlich "NaN Naechte" in der
  // Kernaussage — der Anteil ist auch ohne sie eine vollstaendige Aussage.
  const naechteChance = v.summe.exponierte_naechte_chance;
  const naechteRisiko = v.summe.exponierte_naechte_risiko;
  const naechteGesamt =
    naechteChance != null && naechteRisiko != null ? naechteChance + naechteRisiko : null;

  // Wo die Veränderung liegt, entscheidet, was sie wert ist: Ein Zuwachs in
  // schwach gebuchten Monaten ist Spielraum, derselbe Zuwachs in der
  // ausgebuchten Hauptsaison bringt wenig. Das ist die Frage, die eine DMO an
  // dieser Stelle tatsächlich hat.
  const inSpitzen = betroffen.filter((m) => spitzenNamen.has(m.name)).length;
  const hebel =
    betroffen.length === 0
      ? ""
      : inSpitzen === 0
        ? "Betroffen sind ausschließlich Monate außerhalb Ihrer stärksten drei — dort ist am ehesten Luft nach oben."
        : inSpitzen === betroffen.length
          ? "Betroffen sind Ihre stärksten Monate; hier geht es um das Kerngeschäft, nicht um Randzeiten."
          : "Betroffen sind sowohl starke als auch schwache Monate.";

  const nachkomma = Math.abs(maxDelta) < 5 ? 1 : 0;
  const dz = (n: number) =>
    `${n > 0 ? "+" : ""}${n.toLocaleString("de-DE", { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma })}`;

  return (
    <section className="mb-6 break-inside-avoid rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 print:shadow-none">
      <header className="mb-4 border-b border-slate-100 pb-3">
        <h4 className="text-base font-semibold text-brand">{v.indikator_label}</h4>
        <p className="text-xs text-slate-500">
          {zeitraumLage(v.zeitfenster)} ({v.zeitfenster}), {SZENARIO_SATZ[v.szenario] ?? v.szenario}
        </p>
      </header>

      <Schritt
        nummer={1}
        titel="Ihre Saison"
        satz={
          <>
            Ihr Geschäft konzentriert sich auf {aufzaehlung(spitzen.map((m) => m.name))} — dort fallen{" "}
            <strong>{prozent(spitzenAnteil)}</strong> aller Übernachtungen an. Die übrigen neun
            Monate teilen sich den Rest.
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
              Deutlich verändern sich {betroffen.length === 1 ? "ein Monat" : `${betroffen.length} Monate`}
              : {aufzaehlung(betroffen.map((m) => m.name))}.
              {staerkste && (
                <>
                  {" "}
                  Am stärksten der {staerkste.name} — dort{" "}
                  {staerkste.delta > 0 ? "kommen" : "verschwinden"}{" "}
                  <strong>
                    {dz(Math.abs(staerkste.delta))} {v.einheit.split("/")[0]}
                  </strong>{" "}
                  {staerkste.delta > 0 ? "dazu" : ""} ({dz(staerkste.delta_relativ * 100)} %). Er ist
                  heute {monatsrolle(staerkste.anteil)} mit {prozent(staerkste.anteil)} Ihrer
                  Übernachtungen.
                </>
              )}
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
            Beides übereinandergelegt: Die Monate, die sich deutlich verändern, tragen heute{" "}
            <strong>{prozent(anteilGesamt)}</strong> Ihrer Übernachtungen
            {naechteGesamt != null && <> — {naechte(naechteGesamt)} Nächte</>}.{" "}
            {v.summe.exponierter_anteil_risiko > 0 && v.summe.exponierter_anteil_chance > 0 ? (
              <>
                Dabei geht es in beide Richtungen: {prozent(v.summe.exponierter_anteil_chance)} in
                Monaten, die günstiger werden, {prozent(v.summe.exponierter_anteil_risiko)} in
                Monaten, die schwieriger werden.
              </>
            ) : v.summe.exponierter_anteil_risiko > 0 ? (
              <>Für diese Kennzahl geht die Veränderung durchgängig in die ungünstige Richtung.</>
            ) : (
              <>Für diese Kennzahl geht die Veränderung durchgängig in die günstige Richtung.</>
            )}{" "}
            {hebel}
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

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Was hier „deutlich verändert" heißt: mindestens 15 Prozent Veränderung gegenüber heute und
        mindestens ein ganzer Tag im Jahr. Die Zahl sagt, wie viel Ihres heutigen Geschäfts von der
        Veränderung berührt ist — nicht, wie viele Gäste kommen werden. Das entscheiden Angebot,
        Preise und Ferientermine.
      </p>
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
