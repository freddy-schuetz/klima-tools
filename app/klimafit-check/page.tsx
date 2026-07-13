"use client";

import { useState } from "react";
import { usePolling } from "@/lib/usePolling";
import AmpelBadge from "@/components/AmpelBadge";
import DisclaimerBox from "@/components/DisclaimerBox";
import AboutSection from "@/components/AboutSection";

type SaisonP = { start_doy: number | null; ende_doy: number | null; laenge: number; laenge_min?: number; laenge_max?: number };
type Indikator = { key: string; p1: number; p2: number; p3: { med: number | null; min: number; max: number } };
type Result = {
  ort: string;
  bundesland: string;
  dest_typ: string;
  perioden: { p1: string; p2: string; p3: string };
  modelle: string[];
  indikatoren: Indikator[];
  saison: { label: string; p1: SaisonP; p2: SaisonP; p3: SaisonP; delta_laenge_tage: number | null };
  handlungsfelder?: { titel: string; bezug: string; massnahmen: string[] }[];
  chancen?: string[];
  fazit?: string;
};

const TYPEN = [
  { key: "bade", label: "🏖️ Badedestination" },
  { key: "wander", label: "🥾 Wander-/Raddestination" },
  { key: "winter", label: "⛷️ Winterdestination" },
  { key: "stadt", label: "🏙️ Städtedestination" },
];

const IND_LABEL: Record<string, { label: string; hint: string; chance?: boolean }> = {
  hitzetage: { label: "Hitzetage", hint: "Tmax ≥ 30 °C" },
  sommertage: { label: "Sommertage", hint: "Tmax ≥ 25 °C" },
  tropennaechte: { label: "Tropennächte", hint: "Tmin ≥ 20 °C" },
  frosttage: { label: "Frosttage", hint: "Tmin < 0 °C" },
  eistage: { label: "Eistage", hint: "Tmax < 0 °C" },
  starkregentage: { label: "Starkregentage", hint: "≥ 20 mm/Tag" },
  wandertage: { label: "Aktivtage", hint: "15–28 °C, < 5 mm Regen", chance: true },
};

function doyToDate(doy: number | null) {
  if (doy == null) return "–";
  const d = new Date(2001, 0, doy);
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

export default function KlimacheckPage() {
  const [address, setAddress] = useState("");
  const [destTyp, setDestTyp] = useState("wander");
  const [token, setToken] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const { status, result, errorMessage } = usePolling<Result>(token);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setStartError(null);
    setToken(null);
    try {
      const res = await fetch("/api/klimacheck/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, dest_typ: destTyp }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.error || "start_failed");
      setToken(data.token);
    } catch {
      setStartError("Start fehlgeschlagen — bitte erneut versuchen.");
    }
  }

  const r = result;
  const running = status === "running";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-accent">Klima-Toolbox</p>
        <h1 className="mb-2 text-3xl font-bold text-brand">🌡️ Destinations-Klimacheck</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Wie verändert der Klimawandel <strong>deinen Ort</strong> — nicht dein Reisegebiet, nicht deinen
          Landkreis? Gemessene Vergangenheit (ERA5 seit 1961) trifft CMIP6-Projektion Richtung 2050,
          inklusive <strong>Saisonfenster-Verschiebung</strong> und konkreten Handlungsfeldern.
        </p>
      </header>

      <form onSubmit={start} className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <label className="mb-1 block text-sm font-medium text-slate-700">Ort / Destination</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="z. B. Sankt Peter-Ording"
          required
          minLength={2}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
        <label className="mb-1 block text-sm font-medium text-slate-700">Destinationstyp</label>
        <div className="mb-4 flex flex-wrap gap-2">
          {TYPEN.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setDestTyp(t.key)}
              className={`rounded-full px-3 py-1.5 text-sm ring-1 transition ${
                destTyp === t.key ? "bg-brand text-white ring-brand" : "bg-white text-slate-700 ring-slate-300 hover:ring-brand-accent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={running}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent disabled:opacity-50"
        >
          {running ? "Berechne … (ca. 20 s)" : "Klimacheck starten"}
        </button>
        {startError && <p className="mt-2 text-sm text-red-700">{startError}</p>}
        {(status === "error" || status === "timeout" || status === "not_found") && (
          <p className="mt-2 text-sm text-red-700">{errorMessage ?? "Fehler bei der Berechnung — bitte erneut versuchen."}</p>
        )}
      </form>

      {running && <div className="mb-8 animate-pulse text-sm text-slate-500">Hole 60 Jahre Messdaten + 3 Klimamodelle …</div>}

      {r && status === "done" && (
        <>
          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">{r.saison.label}</h2>
            <p className="mb-4 text-xs text-slate-500">{r.ort}</p>
            <div className="space-y-2">
              {([["p1", r.saison.p1], ["p2", r.saison.p2], ["p3", r.saison.p3]] as const).map(([p, s]) => (
                <div key={p} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 text-xs text-slate-500">{r.perioden[p]}</span>
                  <div className="h-4 flex-1 rounded bg-slate-100">
                    {s.start_doy != null && s.ende_doy != null && (
                      <div
                        className={`h-4 rounded ${p === "p3" ? "bg-brand-accent" : "bg-slate-400"}`}
                        style={{ marginLeft: `${(s.start_doy / 366) * 100}%`, width: `${(Math.max(1, s.ende_doy - s.start_doy) / 366) * 100}%` }}
                        title={`${doyToDate(s.start_doy)} – ${doyToDate(s.ende_doy)}`}
                      />
                    )}
                  </div>
                  <span className="w-40 shrink-0 text-right text-xs tabular-nums text-slate-700">
                    {doyToDate(s.start_doy)} – {doyToDate(s.ende_doy)} · {s.laenge ?? "–"} Tage
                  </span>
                </div>
              ))}
            </div>
            {r.saison.delta_laenge_tage != null && (
              <p className="mt-3 text-sm font-medium text-slate-800">
                {r.saison.delta_laenge_tage >= 0 ? "▲" : "▼"} Saisonfenster verändert sich um{" "}
                <strong>{Math.abs(r.saison.delta_laenge_tage)} Tage</strong> gegenüber 1961–1990
                {r.saison.p3.laenge_min != null && (
                  <span className="text-xs font-normal text-slate-500"> (Modell-Band: {r.saison.p3.laenge_min}–{r.saison.p3.laenge_max} Tage Länge)</span>
                )}
              </p>
            )}
          </section>

          <section className="mb-6 overflow-x-auto rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Kenntage pro Jahr</h2>
            <table className="w-full min-w-105 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2">Indikator</th>
                  <th className="pb-2 text-right">{r.perioden.p1}</th>
                  <th className="pb-2 text-right">{r.perioden.p2}</th>
                  <th className="pb-2 text-right">{r.perioden.p3}</th>
                </tr>
              </thead>
              <tbody>
                {r.indikatoren.map((i) => {
                  const meta = IND_LABEL[i.key] ?? { label: i.key, hint: "" };
                  return (
                    <tr key={i.key} className="border-t border-slate-100">
                      <td className="py-2">
                        <span className="font-medium text-slate-800">{meta.label}</span>{" "}
                        {meta.chance && <span className="text-xs text-emerald-700">Chance</span>}
                        <div className="text-xs text-slate-400">{meta.hint}</div>
                      </td>
                      <td className="py-2 text-right tabular-nums">{i.p1}</td>
                      <td className="py-2 text-right tabular-nums">{i.p2}</td>
                      <td className="py-2 text-right tabular-nums">
                        <strong>{i.p3.med ?? "–"}</strong>{" "}
                        <span className="text-xs text-slate-400">[{i.p3.min}–{i.p3.max}]</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-slate-500">
              2036–2050: Median aus {r.modelle.length} CMIP6-Modellen, [Band] = Modell-Spannweite.
            </p>
          </section>

          {(r.handlungsfelder?.length ?? 0) > 0 && (
            <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Handlungsfelder</h2>
              <div className="space-y-3">
                {r.handlungsfelder!.map((h) => (
                  <div key={h.titel} className="rounded-lg bg-slate-50 p-3">
                    <div className="font-medium text-slate-900">{h.titel}</div>
                    <div className="mb-1 text-xs text-slate-500">{h.bezug}</div>
                    <ul className="list-disc pl-5 text-sm text-slate-700">
                      {h.massnahmen.map((m) => <li key={m}>{m}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
              {(r.chancen?.length ?? 0) > 0 && (
                <p className="mt-3 text-sm text-slate-700">
                  <span className="font-medium text-emerald-700">Chancen:</span> {r.chancen!.join(" · ")}
                </p>
              )}
              {r.fazit && <p className="mt-2 text-sm italic text-slate-600">{r.fazit}</p>}
            </section>
          )}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
            <h2 className="mb-2 font-semibold text-slate-900">Amtliche Vertiefung</h2>
            <p className="mb-2">
              Dieser Check ist der Schnell-Einstieg. Für die amtliche Tiefe:{" "}
              <a className="text-brand-accent underline-offset-2 hover:underline" href="https://gis.uba.de/maps/resources/apps/tourismus/index.html?lang=de" target="_blank" rel="noopener noreferrer">UBA „Klimawandel und Tourismus"</a>{" · "}
              <a className="text-brand-accent underline-offset-2 hover:underline" href="https://www.gerics.de/products_and_publications/fact_sheets/landkreise/index.php.de" target="_blank" rel="noopener noreferrer">GERICS-Klimaausblick für deinen Landkreis</a>{" · "}
              <a className="text-brand-accent underline-offset-2 hover:underline" href="https://www.klivoportal.de/" target="_blank" rel="noopener noreferrer">KLiVO-Katalog</a>
            </p>
            <p className="text-xs text-slate-500">
              Was ist hier anders? Ort-genau statt Reisegebiet/Landkreis · Saisonfenster als berechneter Indikator ·
              Handlungsfelder statt nur Karten · Sofort-Ergebnis statt statischem PDF.
            </p>
          </section>

          <div className="mb-8">
            <DisclaimerBox
              items={[
                "Erstcheck, kein Klimagutachten: CMIP6-Projektionen liegen auf einem ~10–25-km-Raster — kleinräumige Effekte (Küste, Berg, Stadt) bildet das Modell nur begrenzt ab.",
                `Projektion = Median aus ${r.modelle.length} Modellen (${r.modelle.join(", ")}), Spannweite wird mit angezeigt; Zeitraum 2036–2050 (die frei verfügbaren CMIP6-Daten enden 2050).`,
                "Badesaison/Aktivtage sind Temperatur-Proxys (Lufttemperatur, kein Wassertemperatur-/Schneemodell).",
                "Handlungsfelder werden KI-gestützt ausschließlich aus den hier berechneten Zahlen und einem kuratierten Maßnahmenkatalog abgeleitet.",
                "Daten: ERA5 (ECMWF/Copernicus) & CMIP6 HighResMIP via Open-Meteo (CC-BY 4.0).",
              ]}
            />
          </div>
        </>
      )}

      <AboutSection mailSubject="Destinations-Klimacheck" />
    </main>
  );
}
