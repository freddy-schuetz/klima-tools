/**
 * Alle Kennzahlen als Anhangstabelle.
 *
 * Als Kachelpaare gesetzt belegte dieses Kapitel im Ausdruck eine Seite je
 * Kennzahl — bei neunzehn Kennzahlen also neunzehn Seiten für Werte, die man
 * nebeneinander lesen will. Als Tabelle passen dieselben Werte auf zwei Seiten,
 * und der Vergleich zwischen den Szenarien steht endlich in einer Zeile.
 *
 * Der Datenvertrag verlangt, dass kein Wert ohne Szenario, Zeitfenster und
 * Lesart seiner Bandbreite erscheint. Deshalb steht die Bandbreite in derselben
 * Zelle wie der Median, und die Lesart als Fußnote unter der Tabelle — nicht
 * weggelassen, nur einmal statt vierzigmal.
 */
"use client";

import type { WertT } from "./Kennzahl";

const VALIDITAET_KURZ: Record<string, string> = {
  hoch: "hoch",
  mittel: "eingeschränkt",
  niedrig: "nur zur Veranschaulichung",
};

function zahl(n: number | null, einheit: string): string {
  if (n == null) return "–";
  const stellen = einheit.includes("°C") || Math.abs(n) < 10 ? 1 : 0;
  return n.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
}

function zelle(w: WertT | undefined): React.ReactNode {
  if (!w) return <span className="text-slate-300">–</span>;
  const spanne =
    w.unten != null && w.oben != null ? `${zahl(w.unten, w.einheit)}–${zahl(w.oben, w.einheit)}` : null;
  return (
    <>
      <span className="font-medium">{zahl(w.median, w.einheit)}</span>
      {spanne && <span className="block text-[10px] text-slate-500">{spanne}</span>}
    </>
  );
}

export default function Kennzahlentabelle({
  gruppen,
}: {
  gruppen: Record<string, { label: string; einheit: string; werte: WertT[] }>;
}) {
  const zeilen: {
    schluessel: string;
    label: string;
    einheit: string;
    zeitfenster: string;
    referenz?: WertT;
    rcp45?: WertT;
    rcp85?: WertT;
    validitaet: string;
    art: string;
  }[] = [];

  for (const [schluessel, gruppe] of Object.entries(gruppen)) {
    const referenz = gruppe.werte.find((w) => w.szenario === "referenz");
    const fenster = [...new Set(gruppe.werte.filter((w) => w.szenario !== "referenz").map((w) => w.zeitfenster))].sort();
    for (const zf of fenster) {
      const rcp45 = gruppe.werte.find((w) => w.szenario === "rcp45" && w.zeitfenster === zf);
      const rcp85 = gruppe.werte.find((w) => w.szenario === "rcp85" && w.zeitfenster === zf);
      zeilen.push({
        schluessel: `${schluessel}-${zf}`,
        label: gruppe.label,
        einheit: gruppe.einheit,
        zeitfenster: zf,
        referenz,
        rcp45,
        rcp85,
        validitaet: (rcp85 ?? rcp45 ?? referenz)?.validitaet ?? "hoch",
        art: (rcp85 ?? rcp45)?.bandbreite_label ?? "",
      });
    }
  }

  if (zeilen.length === 0) return null;

  const alsAenderung = Object.values(gruppen).some((g) =>
    g.werte.some((w) => (w.hinweis ?? "").includes("Änderung")),
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-300 text-[11px] uppercase tracking-wide text-slate-500">
              <th scope="col" className="py-1.5 pr-3 font-semibold">Kennzahl</th>
              <th scope="col" className="py-1.5 pr-3 font-semibold">Zeitraum</th>
              <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Referenz</th>
              <th scope="col" className="py-1.5 pr-3 text-right font-semibold">RCP4.5</th>
              <th scope="col" className="py-1.5 pr-3 text-right font-semibold">RCP8.5</th>
              <th scope="col" className="py-1.5 pr-3 font-semibold">Einheit</th>
              <th scope="col" className="py-1.5 font-semibold">Belastbarkeit</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr key={z.schluessel} className="border-b border-slate-100 align-top">
                <td className="py-1.5 pr-3 text-slate-800">{z.label}</td>
                <td className="py-1.5 pr-3 text-slate-600">{z.zeitfenster}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-slate-600">{zelle(z.referenz)}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-sky-800">{zelle(z.rcp45)}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-red-800">{zelle(z.rcp85)}</td>
                <td className="py-1.5 pr-3 text-slate-500">{z.einheit}</td>
                <td className="py-1.5 text-slate-500">{VALIDITAET_KURZ[z.validitaet] ?? z.validitaet}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Große Zahl: Median des Modellensembles. Kleine Zahl darunter: Bandbreite in der jeweils
        ausgewiesenen Lesart (Ensemble-Extremwerte bei GERICS, Spannweite der Modellketten bei der
        Eigenrechnung).{" "}
        {alsAenderung && "Werte, deren Quelle Änderungen liefert, sind als Änderung gegenüber der Referenzperiode angegeben. "}
        Szenarien sind Bandbreiten möglicher Entwicklungen, keine Vorhersagen.
      </p>
    </div>
  );
}
