/**
 * Alle Expositionen als eine Tabelle statt als Dutzende Einzelgrafiken.
 *
 * Jede Kennzahl wird in zwei Szenarien und zwei Zeitfenstern gerechnet — bei
 * gut einem Dutzend Kennzahlen sind das über vierzig Verschneidungen. Als
 * einzelne Monatsmatrizen ausgespielt ergab das allein im Detailteil rund
 * vierzig Druckseiten und war exakt das, was am ersten Entwurf als
 * „überfrachtet" zurückkam.
 *
 * Die ausführliche Monatsdarstellung bleibt den Kennzahlen im Kurzreport
 * vorbehalten; hier steht das Ergebnis je Zeile, mit den betroffenen Monaten
 * im Klartext. Wer eine Zeile genauer ansehen will, findet die Kennzahl oben.
 */
"use client";

import type { VerschneidungT } from "./HerleitungDrei";

const SZENARIO_KURZ: Record<string, string> = { rcp45: "RCP4.5", rcp85: "RCP8.5" };

const prozent = (a: number) =>
  a > 0 ? `${(a * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %` : "–";

export default function ExpositionsUebersicht({ eintraege }: { eintraege: VerschneidungT[] }) {
  if (eintraege.length === 0) return null;

  const sortiert = [...eintraege].sort((a, b) => {
    const nachName = a.indikator_label.localeCompare(b.indikator_label, "de");
    if (nachName !== 0) return nachName;
    if (a.zeitfenster !== b.zeitfenster) return a.zeitfenster.localeCompare(b.zeitfenster);
    return a.szenario.localeCompare(b.szenario);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
        <caption className="mb-2 text-left text-[11px] text-slate-500">
          Anteil der heutigen Übernachtungen in Monaten, deren klimatische Bedingungen sich im
          jeweiligen Szenario deutlich verändern. Expositions-Analyse, keine Nachfrageprognose.
        </caption>
        <thead>
          <tr className="border-b border-slate-300 text-[11px] uppercase tracking-wide text-slate-500">
            <th scope="col" className="py-1.5 pr-3 font-semibold">Kennzahl</th>
            <th scope="col" className="py-1.5 pr-3 font-semibold">Szenario</th>
            <th scope="col" className="py-1.5 pr-3 font-semibold">Zeitraum</th>
            <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Chance</th>
            <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Risiko</th>
            <th scope="col" className="py-1.5 font-semibold">betroffene Monate</th>
          </tr>
        </thead>
        <tbody>
          {sortiert.map((v, i) => {
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
  );
}
