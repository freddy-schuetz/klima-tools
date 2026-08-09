/**
 * Alle Expositionen als Tabelle statt als Dutzende Einzelkarten.
 *
 * Jede Kennzahl wird in zwei Szenarien und zwei Zeitfenstern gerechnet — bei gut
 * einem Dutzend Kennzahlen sind das über vierzig Verschneidungen. Als einzelne
 * Karten und Monatsmatrizen ausgespielt ergab das allein im Detailteil vierzig
 * Druckseiten und war exakt das, was am ersten Entwurf als „überfrachtet"
 * zurückkam.
 *
 * Die ausführliche Darstellung bleibt den Befunden im Kurzreport vorbehalten;
 * hier steht das Ergebnis je Zeile. Zwei Bauformen, zwei Tabellen: die
 * Monatsrechnung nennt betroffene Monate, die saisonale Zuordnung nennt
 * Ausgangswert und Szenariowert — sie in eine gemeinsame Tabelle zu pressen
 * würde beide Aussagen verwischen.
 */
"use client";

import type { VerschneidungT } from "./HerleitungDrei";
import type { SaisonExpositionT } from "./SaisonExposition";

const SZENARIO_KURZ: Record<string, string> = { rcp45: "RCP4.5", rcp85: "RCP8.5" };

const prozent = (a: number) =>
  a > 0 ? `${(a * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %` : "–";

const zahl = (n: number) =>
  Math.abs(n) >= 100
    ? Math.round(n).toLocaleString("de-DE")
    : (Math.round(n * 10) / 10).toLocaleString("de-DE");

const KOPF = "border-b border-slate-300 text-[11px] uppercase tracking-wide text-slate-500";

export default function ExpositionsUebersicht({
  monatlich = [],
  saisonal = [],
}: {
  monatlich?: VerschneidungT[];
  saisonal?: SaisonExpositionT[];
}) {
  if (monatlich.length === 0 && saisonal.length === 0) return null;

  const nachName = <T extends { indikator_label: string; zeitfenster: string; szenario: string }>(a: T, b: T) =>
    a.indikator_label.localeCompare(b.indikator_label, "de") ||
    a.zeitfenster.localeCompare(b.zeitfenster) ||
    a.szenario.localeCompare(b.szenario);

  return (
    <div className="space-y-6">
      <p className="text-[11px] leading-relaxed text-slate-500">
        Anteil der heutigen Übernachtungen in Monaten, deren klimatische Bedingungen sich im
        jeweiligen Szenario deutlich verändern. Expositions-Analyse, keine Nachfrageprognose.
      </p>

      {saisonal.length > 0 && (
        <div className="overflow-x-auto">
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Jahres- und Saisonkennzahlen
          </h4>
          <table className="w-full min-w-[38rem] border-collapse text-left text-xs">
            <thead>
              <tr className={KOPF}>
                <th scope="col" className="py-1.5 pr-3 font-semibold">Kennzahl</th>
                <th scope="col" className="py-1.5 pr-3 font-semibold">Szenario</th>
                <th scope="col" className="py-1.5 pr-3 font-semibold">Zeitraum</th>
                <th scope="col" className="py-1.5 pr-3 text-right font-semibold">heute</th>
                <th scope="col" className="py-1.5 pr-3 text-right font-semibold">im Szenario</th>
                <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Anteil</th>
                <th scope="col" className="py-1.5 pr-3 font-semibold">Richtung</th>
                <th scope="col" className="py-1.5 font-semibold">Wirkmonate</th>
              </tr>
            </thead>
            <tbody>
              {[...saisonal].sort(nachName).map((e, i) => (
                <tr key={`${e.indikator}-${e.szenario}-${e.zeitfenster}-${i}`} className="border-b border-slate-100 align-top">
                  <td className="py-1.5 pr-3 text-slate-800">{e.indikator_label}</td>
                  <td className="py-1.5 pr-3 text-slate-600">{SZENARIO_KURZ[e.szenario] ?? e.szenario}</td>
                  <td className="py-1.5 pr-3 text-slate-600">{e.zeitfenster}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-slate-600">{zahl(e.referenz)}</td>
                  <td
                    className={`py-1.5 pr-3 text-right tabular-nums ${
                      e.richtung === "risiko" ? "text-orange-700" : e.richtung === "chance" ? "text-sky-700" : "text-slate-600"
                    }`}
                  >
                    {zahl(e.zukunft)} ({e.delta > 0 ? "+" : "−"}
                    {zahl(Math.abs(e.delta))})
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-slate-600">
                    {Math.round(e.anteil_uebernachtungen * 100)} %
                  </td>
                  {/* Die Richtung MUSS als Text dastehen: aus dem Vorzeichen
                      allein folgt sie nicht (mehr Sommertage = Chance, mehr
                      heiße Tage = Risiko), und im Graustufendruck oder bei
                      Farbsehschwäche bliebe die Zeile sonst ohne Aussage. */}
                  <td className="py-1.5 pr-3 text-slate-700">{e.richtung_label}</td>
                  <td className="py-1.5 text-slate-600">{e.wirkmonate.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {monatlich.length > 0 && (
        <div className="overflow-x-auto">
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Kennzahlen mit Monatsrechnung
          </h4>
          <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
            <thead>
              <tr className={KOPF}>
                <th scope="col" className="py-1.5 pr-3 font-semibold">Kennzahl</th>
                <th scope="col" className="py-1.5 pr-3 font-semibold">Szenario</th>
                <th scope="col" className="py-1.5 pr-3 font-semibold">Zeitraum</th>
                <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Chance</th>
                <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Risiko</th>
                <th scope="col" className="py-1.5 font-semibold">betroffene Monate</th>
              </tr>
            </thead>
            <tbody>
              {[...monatlich].sort(nachName).map((v, i) => {
                const monate = [...(v.summe.monate_chance ?? []), ...(v.summe.monate_risiko ?? [])];
                return (
                  <tr key={`${v.indikator}-${v.szenario}-${v.zeitfenster}-${i}`} className="border-b border-slate-100 align-top">
                    <td className="py-1.5 pr-3 text-slate-800">{v.indikator_label}</td>
                    <td className="py-1.5 pr-3 text-slate-600">{SZENARIO_KURZ[v.szenario] ?? v.szenario}</td>
                    <td className="py-1.5 pr-3 text-slate-600">{v.zeitfenster}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-sky-700">
                      {prozent(v.summe.exponierter_anteil_chance)}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-orange-700">
                      {prozent(v.summe.exponierter_anteil_risiko)}
                    </td>
                    <td className="py-1.5 text-slate-600">
                      {monate.length > 0 ? monate.join(", ") : <span className="text-slate-400">keiner</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
