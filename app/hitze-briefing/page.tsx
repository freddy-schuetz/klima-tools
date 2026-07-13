"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Facility, Overlay } from "@/components/HeatMap";
import DisclaimerBox from "@/components/DisclaimerBox";
import AboutSection from "@/components/AboutSection";

const HeatMap = dynamic(() => import("@/components/HeatMap"), {
  ssr: false,
  loading: () => <div className="flex h-[440px] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">Karte lädt …</div>,
});

type Briefing = {
  bbox: { s: number; w: number; n: number; e: number };
  heat_verfuegbar: boolean;
  heat_reason: string | null;
  overlay: Overlay;
  einrichtungen_gesamt: number;
  kategorien_count: Record<string, number>;
  ranking: Facility[];
  methodik: { gewichte: Record<string, number> };
};

const KAT_LABEL: Record<string, string> = {
  pflegeheim: "Pflege/Senioren", krankenhaus: "Krankenhaus", kita: "Kita", schule: "Schule", spielplatz: "Spielplatz",
};

function ScoreDot({ score }: { score: number | null }) {
  const c = score == null ? "#94a3b8" : score >= 70 ? "#b91c1c" : score >= 55 ? "#ea580c" : score >= 40 ? "#f59e0b" : "#65a30d";
  return <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c }} aria-hidden />;
}

export default function HitzeBriefingPage() {
  const [ort, setOrt] = useState("");
  const [radius, setRadius] = useState(1.5);
  const [data, setData] = useState<Briefing | null>(null);
  const [ortName, setOrtName] = useState("");
  const [status, setStatus] = useState<"idle" | "geocoding" | "computing" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setStatus("geocoding");
    setData(null);
    setErrMsg(null);
    try {
      const geo = await fetch(`/api/geocode?q=${encodeURIComponent(ort)}`).then((r) => r.json());
      const hit = geo?.hits?.[0];
      if (!hit?.lat || !hit?.lng) throw new Error("Ort nicht gefunden");
      setOrtName(hit.label ?? ort);
      const dLat = radius / 111;
      const dLon = radius / (111 * Math.cos((hit.lat * Math.PI) / 180));
      const bbox = `${(hit.lat - dLat).toFixed(5)},${(hit.lng - dLon).toFixed(5)},${(hit.lat + dLat).toFixed(5)},${(hit.lng + dLon).toFixed(5)}`;
      setStatus("computing");
      const res = await fetch(`/api/hitze?bbox=${bbox}`);
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || "Berechnung fehlgeschlagen");
      setData(d);
      setStatus("done");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Fehler");
      setStatus("error");
    }
  }

  const top = data?.ranking.filter((r) => r.score != null).slice(0, 10) ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 print:max-w-none">
      <header className="mb-8 print:mb-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-accent print:hidden">Klima-Toolbox</p>
        <h1 className="mb-2 text-3xl font-bold text-brand print:text-2xl">🏙️ Hitze-Briefing für Kommunen</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600 print:hidden">
          Der Erstcheck <em>vor</em> der teuren Stadtklimaanalyse — gedacht für die vielen kleinen
          Kommunen unter dem Radar der Großstadt-Tools. In 3 Minuten: <strong>wo trifft Hitze auf
          Verwundbarkeit</strong>, als priorisierte Einrichtungsliste und Karte.
        </p>
      </header>

      <form onSubmit={run} className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 print:hidden">
        <label className="mb-1 block text-sm font-medium text-slate-700">Ort / Kommune</label>
        <input
          value={ort}
          onChange={(e) => setOrt(e.target.value)}
          placeholder="z. B. Bad Belzig"
          required
          minLength={2}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
        <label className="mb-1 block text-sm font-medium text-slate-700">Umkreis: {radius} km</label>
        <input type="range" min={1} max={4} step={0.5} value={radius} onChange={(e) => setRadius(parseFloat(e.target.value))} className="mb-4 w-full" />
        <button
          type="submit"
          disabled={status === "geocoding" || status === "computing"}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent disabled:opacity-50"
        >
          {status === "computing" ? "Werte Satellitendaten aus … (bis zu 40 s)" : status === "geocoding" ? "Suche Ort …" : "Briefing erstellen"}
        </button>
        {status === "error" && <p className="mt-2 text-sm text-red-700">{errMsg}</p>}
      </form>

      {status === "computing" && <div className="mb-6 animate-pulse text-sm text-slate-500">Lade Landsat-Sommer-Median + OSM-Einrichtungen …</div>}

      {data && status === "done" && (
        <>
          <div className="mb-4 flex items-center justify-between print:mb-2">
            <h2 className="text-lg font-semibold text-slate-900">Hitze-Screening: {ortName.split(",")[0]}</h2>
            <button onClick={() => window.print()} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 print:hidden">
              🖨️ Als PDF / Vorlage
            </button>
          </div>

          {!data.heat_verfuegbar && (
            <div className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
              Für diesen Ausschnitt liegt aktuell kein wolkenarmes Sommer-Satellitenbild vor — die Einrichtungen
              werden ohne Hitze-Perzentil gelistet. Bitte kleineren/anderen Umkreis probieren.
            </div>
          )}

          {data.overlay && (
            <div className="mb-4">
              <HeatMap bbox={data.bbox} overlay={data.overlay} facilities={data.ranking} />
              <p className="mt-1 text-xs text-slate-500">
                Rot = relativ heißeste Zonen im Gebiet (Oberflächentemperatur, Sommer-Median). Größere Punkte = höhere Priorität.
              </p>
            </div>
          )}

          <section className="mb-6 overflow-x-auto rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-1 font-semibold text-slate-900">Prioritäten: wo Hitze auf Verwundbarkeit trifft</h3>
            <p className="mb-3 text-xs text-slate-500">
              {data.einrichtungen_gesamt} Einrichtungen erfasst · Score = Hitze-Perzentil × Vulnerabilität der Nutzergruppe
            </p>
            <table className="w-full min-w-120 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2">#</th><th className="pb-2">Einrichtung</th><th className="pb-2">Typ</th>
                  <th className="pb-2 text-right">Hitze-Perzentil</th><th className="pb-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {top.map((r, i) => (
                  <tr key={`${r.name}-${i}`} className="border-t border-slate-100">
                    <td className="py-2 tabular-nums text-slate-400">{i + 1}</td>
                    <td className="py-2 font-medium text-slate-800">{r.name}</td>
                    <td className="py-2 text-slate-600">{KAT_LABEL[r.kategorie] ?? r.kategorie}</td>
                    <td className="py-2 text-right tabular-nums">{r.lst_perzentil ?? "–"}</td>
                    <td className="py-2 text-right"><span className="inline-flex items-center gap-1.5 tabular-nums"><ScoreDot score={r.score} />{r.score ?? "–"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              {Object.entries(data.kategorien_count).map(([k, n]) => (
                <span key={k}>{KAT_LABEL[k] ?? k}: {n}</span>
              ))}
            </div>
          </section>

          <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
            <h3 className="mb-2 font-semibold text-slate-900">Nächste Schritte & amtliche Vertiefung</h3>
            <p className="mb-2">
              Dieses Screening priorisiert, wo eine genauere Betrachtung lohnt. Vertiefung:{" "}
              <a className="text-brand-accent underline-offset-2 hover:underline" href="https://www.klivoportal.de/" target="_blank" rel="noopener noreferrer">KLiVO-Anpassungsdienste</a>{" · "}
              <a className="text-brand-accent underline-offset-2 hover:underline" href="https://www.zentrum-klimaanpassung.de/" target="_blank" rel="noopener noreferrer">Zentrum KlimaAnpassung</a>{" "}
              (Beratung + DAS-Förderung Anpassungsmanager) · Landes-Klimaatlanten für amtliche Stadtklimakarten.
            </p>
          </section>

          <div className="mb-8 print:hidden">
            <DisclaimerBox
              items={[
                "Screening, kein Gutachten: ersetzt keine Stadtklimaanalyse und keine Klimafunktionskarte.",
                "Datengrundlage ist die Oberflächentemperatur (Landsat, Sommer-Median mehrerer Jahre) — NICHT die Lufttemperatur. Perzentile gelten relativ innerhalb des gewählten Gebiets.",
                "Die Vollständigkeit der Einrichtungen hängt von OpenStreetMap ab (Zählung je Kategorie ist angegeben) — fehlende Objekte bitte in OSM ergänzen.",
                "Der Score kombiniert Hitze-Perzentil mit einem Vulnerabilitäts-Gewicht der Nutzergruppe (Pflege > Krankenhaus > Kita > Schule > Spielplatz) — eine transparente Heuristik, kein amtlicher Index.",
                "Datenquellen: Landsat C2 L2 (USGS/NASA) via Microsoft Planetary Computer, OpenStreetMap.",
              ]}
            />
          </div>
        </>
      )}

      <div className="print:hidden">
        <AboutSection mailSubject="Hitze-Briefing für Kommunen" />
      </div>
    </main>
  );
}
