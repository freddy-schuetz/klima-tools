// Ein Klimaindikator-Wert. Die Regel dahinter: eine Zahl darf im Report nie ohne
// Szenario, Bandbreiten-Lesart und Quelle erscheinen — deshalb rendert diese
// Komponente alles gemeinsam und nicht als optionale Zusatzinfo.
export type WertT = {
  indikator: string;
  label: string;
  einheit: string;
  median: number | null;
  unten: number | null;
  oben: number | null;
  bandbreite_art: string;
  bandbreite_label: string;
  ensemble_n: number | null;
  szenario: string;
  szenario_label: string;
  zeitfenster: string;
  quelle_id: string;
  validitaet: "hoch" | "mittel" | "niedrig";
  hinweis?: string | null;
};

const VALIDITAET: Record<string, { label: string; cls: string }> = {
  hoch: { label: "hohe Belastbarkeit", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  mittel: { label: "eingeschränkte Belastbarkeit", cls: "bg-amber-50 text-amber-900 ring-amber-200" },
  niedrig: { label: "nur zur Veranschaulichung", cls: "bg-slate-100 text-slate-700 ring-slate-200" },
};

function zahl(n: number | null, einheit: string) {
  if (n === null || n === undefined) return "–";
  const gerundet = Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  return `${gerundet.toLocaleString("de-DE")} ${einheit.split("/")[0]}`.trim();
}

export function Kennzahl({ wert, referenz }: { wert: WertT; referenz?: WertT | null }) {
  const v = VALIDITAET[wert.validitaet] ?? VALIDITAET.mittel;
  const delta =
    referenz?.median != null && wert.median != null ? wert.median - referenz.median : null;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-medium text-slate-900">{wert.label}</span>
        <span className="text-xs text-slate-500">{wert.zeitfenster}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
        <span className="text-2xl font-bold text-brand">{zahl(wert.median, wert.einheit)}</span>
        {wert.unten != null && wert.oben != null && (
          <span className="text-sm text-slate-500">
            ({zahl(wert.unten, "")} – {zahl(wert.oben, "")})
          </span>
        )}
        {delta != null && (
          <span className={`text-sm font-semibold ${delta > 0 ? "text-orange-700" : "text-sky-700"}`}>
            {delta > 0 ? "+" : "−"}
            {zahl(Math.abs(delta), "")} ggü. heute
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
          {wert.szenario_label}
        </span>
        <span className={`rounded-full px-2 py-0.5 font-medium ring-1 ${v.cls}`}>{v.label}</span>
        <span>
          {wert.bandbreite_label}
          {wert.ensemble_n ? ` (${wert.ensemble_n} Modellläufe)` : ""}
        </span>
      </div>
      {wert.hinweis && <p className="mt-2 text-xs text-slate-600">{wert.hinweis}</p>}
    </div>
  );
}

// Szenarien stehen nebeneinander und werden nie in einer Grafik vermischt —
// das ist die Vorgabe der Bund-Länder-Leitlinien für Klimaprojektionen.
export function SzenarienPaar({
  titel,
  werte,
}: {
  titel: string;
  werte: WertT[];
}) {
  const referenz = werte.find((w) => w.szenario === "referenz") ?? null;
  const projektionen = werte.filter((w) => w.szenario !== "referenz");
  if (!projektionen.length && !referenz) return null;

  return (
    <section className="mb-6">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{titel}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {referenz && <Kennzahl wert={referenz} />}
        {projektionen.map((w) => (
          <Kennzahl key={`${w.szenario}-${w.zeitfenster}`} wert={w} referenz={referenz} />
        ))}
      </div>
    </section>
  );
}
