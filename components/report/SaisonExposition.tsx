/**
 * Befunde, die als Jahres- oder Saisonwert vorliegen — Schnee, Beschneiung, Hitze.
 *
 * Diese Kennzahlen gibt es nicht je Monat, sondern nur für den ganzen Winter
 * oder das ganze Jahr. Sie lassen sich deshalb nicht wie die Monatsrechnung
 * Monat für Monat mit der Saisonkurve verschneiden; zugeordnet werden sie den
 * Monaten, in denen sie überhaupt wirken.
 *
 * Die erste Fassung stellte das als Kennzahlenblock dar: „heute 96 Tage / im
 * Szenario 0 Tage (−96) / betroffener Anteil 39 % / rund 457.148 Nächte /
 * Risiko · wirksam in Dezember, Januar, Februar, März". Fachlich vollständig,
 * aber niemand liest daraus einen Satz. Jetzt steht der Satz da, und die Zahlen
 * stehen darin.
 */
"use client";

import { aufzaehlung, einheitImSatz, naechte, SZENARIO_SATZ, zeitraumLage } from "@/lib/klartext";

export type SaisonExpositionT = {
  art: "saisonal";
  indikator: string;
  indikator_label: string;
  indikator_erklaerung?: string;
  einheit: string;
  szenario: string;
  zeitfenster: string;
  wirkmonate: string[];
  referenz: number;
  zukunft: number;
  delta: number;
  delta_relativ?: number;
  richtung: "chance" | "risiko" | "neutral";
  richtung_label: string;
  anteil_uebernachtungen: number;
  naechte_in_wirkmonaten?: number;
  label: string;
  einordnung: string;
  methodik: string;
  validitaet: string;
};

// Blau gegen Orange statt Rot-Grün: bleibt auch bei Farbsehschwäche
// unterscheidbar, und die Richtung steht zusätzlich als Text daneben.
const FARBE: Record<string, { rand: string; strich: string; text: string }> = {
  chance: { rand: "ring-sky-200", strich: "border-sky-500", text: "text-sky-900" },
  risiko: { rand: "ring-orange-200", strich: "border-orange-500", text: "text-orange-900" },
  neutral: { rand: "ring-slate-200", strich: "border-slate-300", text: "text-slate-700" },
};

function zahl(n: number): string {
  if (Math.abs(n) < 0.05) return "0";
  return Math.abs(n) >= 100
    ? Math.round(n).toLocaleString("de-DE")
    : (Math.round(n * 10) / 10).toLocaleString("de-DE");
}


export default function SaisonExposition({ eintraege }: { eintraege: SaisonExpositionT[] }) {
  // Nur die Kennzahlen zeigen, die sich überhaupt bewegen — eine Liste aus
  // 37 Zeilen, von denen 30 „kaum verändert" sagen, liest niemand.
  const relevant = eintraege.filter((e) => e.richtung !== "neutral");
  if (!relevant.length) return null;

  const sortiert = [...relevant].sort((a, b) => {
    if (a.richtung !== b.richtung) return a.richtung === "risiko" ? -1 : 1;
    return b.anteil_uebernachtungen - a.anteil_uebernachtungen;
  });

  return (
    <div className="space-y-3">
      {sortiert.map((e, i) => {
        const f = FARBE[e.richtung] ?? FARBE.neutral;
        // Der Bezugsrahmen („im Jahr", „je Winter") steht einmal am Anfang; die
        // folgenden Zahlen im selben Satz beziehen sich erkennbar darauf.
        // Die Einzahl richtet sich nach der ANGEZEIGTEN Zahl, nicht nach dem
        // Rohwert: 1,04 wird als „1" gedruckt und verlangt dann „1 Tag".
        const heute = zahl(e.referenz);
        const kuenftig = zahl(e.zukunft);
        const abstand = zahl(Math.abs(e.delta));
        const einheit = einheitImSatz(e.einheit, "nominativ", "lang", heute === "1");
        const einheitKurz = einheitImSatz(e.einheit, "nominativ", "kurz", kuenftig === "1");
        const einheitDativ = einheitImSatz(e.einheit, "dativ", "kurz", abstand === "1");
        const wirdMehr = e.delta > 0;
        const verschwindet = Math.abs(e.zukunft) < 0.05;
        const anteil = Math.round(e.anteil_uebernachtungen * 100);
        return (
          <figure
            key={`${e.indikator}-${e.szenario}-${e.zeitfenster}-${i}`}
            className={`break-inside-avoid rounded-2xl border-l-4 bg-white p-4 shadow-sm ring-1 print:shadow-none ${f.rand} ${f.strich}`}
          >
            <figcaption className="mb-2">
              <h4 className="font-semibold text-slate-900">{e.indikator_label}</h4>
              {e.indikator_erklaerung && (
                <p className="mt-0.5 text-xs text-slate-500">{e.indikator_erklaerung}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                {zeitraumLage(e.zeitfenster)} ({e.zeitfenster}),{" "}
                {SZENARIO_SATZ[e.szenario] ?? e.szenario}
              </p>
            </figcaption>

            {/* Der Befund als Satz — die Zahlen stehen darin, nicht daneben. */}
            <p className="text-sm leading-relaxed text-slate-800">
              Heute {heute === "1" ? "ist es" : "sind es"}{" "}
              <strong>
                {heute} {einheit}
              </strong>
              .{" "}
              {verschwindet ? (
                <>
                  In diesem Szenario bleibt davon <strong className={f.text}>nichts</strong> übrig.
                </>
              ) : (
                <>
                  In diesem Szenario {kuenftig === "1" ? "ist es" : "sind es"}{" "}
                  <strong className={f.text}>
                    {kuenftig} {einheitKurz}
                  </strong>{" "}
                  — {wirdMehr ? "ein Plus" : "ein Minus"} von {abstand} {einheitDativ}
                  {e.delta_relativ != null && Math.abs(e.referenz) >= 5 && (
                    <> ({wirdMehr ? "+" : "−"}
                    {Math.round(Math.abs(e.delta_relativ) * 100)} %)</>
                  )}
                  .
                </>
              )}
            </p>

            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Wirksam wird das in {aufzaehlung(e.wirkmonate)} — {e.wirkmonate.length === 1 ? "dem Monat" : "den Monaten"},
              in {e.wirkmonate.length === 1 ? "dem" : "denen"} heute <strong>{anteil} %</strong> Ihrer
              Übernachtungen anfallen
              {e.naechte_in_wirkmonaten != null && <> ({naechte(e.naechte_in_wirkmonaten)} Nächte)</>}.
            </p>

            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Dieser Wert gilt für den gesamten Zeitraum, nicht für einzelne Monate — er zeigt die
              Größenordnung, nicht den genauen Monat. Und er sagt, wie viel Ihres heutigen Geschäfts
              betroffen ist, nicht wie viele Gäste kommen werden.
            </p>
          </figure>
        );
      })}
    </div>
  );
}
