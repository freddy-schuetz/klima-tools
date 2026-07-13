"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import DisclaimerBox from "@/components/DisclaimerBox";
import AboutSection from "@/components/AboutSection";
import type { MapMarker } from "@/components/MarkerMap";

const MarkerMap = dynamic(() => import("@/components/MarkerMap"), {
  ssr: false,
  loading: () => <div className="flex h-[380px] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">Karte lädt …</div>,
});

const TYP_HEX: Record<string, string> = { bluete: "#c026d3", vogelzug: "#0284c7", laub: "#ea580c" };

type Sight = { datum: string; lat: number; lng: number; foto: string | null; ort: string };
type Art = {
  art_key: string;
  label: string;
  typ: string;
  region_label: string;
  phase: "peak" | "steigt" | "faellt" | "ruhig";
  trend: string;
  anteil_permille: number;
  zielart_14d: number;
  alle_14d: number;
  clock_delta_tage: number;
  kampagne_aktiv: boolean;
  history: { d: string; a: number }[];
  sightings: Sight[];
};
type Data = { arten: Art[]; updated_at: string; quelle: string };

const PHASE: Record<string, { label: string; cls: string }> = {
  peak: { label: "Peak – jetzt!", cls: "bg-emerald-600 text-white" },
  steigt: { label: "steigt an", cls: "bg-amber-200 text-amber-900" },
  faellt: { label: "klingt ab", cls: "bg-orange-200 text-orange-900" },
  ruhig: { label: "noch ruhig", cls: "bg-slate-100 text-slate-600" },
};
const TYP_EMOJI: Record<string, string> = { bluete: "🌸", vogelzug: "🐦", laub: "🍂" };

function Spark({ history }: { history: { d: string; a: number }[] }) {
  if (history.length < 2) return null;
  const vals = history.map((h) => h.a);
  const max = Math.max(...vals, 1), min = Math.min(...vals, 0);
  const W = 90, H = 24, pad = 2;
  const pts = vals.map((v, i) => `${pad + (i / (vals.length - 1)) * (W - 2 * pad)},${H - pad - ((v - min) / (max - min || 1)) * (H - 2 * pad)}`);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label="Meldedichte-Verlauf" className="shrink-0">
      <polyline points={pts.join(" ")} fill="none" stroke="#64748b" strokeWidth="1.5" />
    </svg>
  );
}

export default function SaisonRadarPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/saison", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-accent">Klima-Toolbox</p>
        <h1 className="mb-2 text-3xl font-bold text-brand">🌸 Saison-Radar</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Der Naturkalender gibt den Takt vor, nicht der Kalender: Aus <strong>Live-Meldedichte</strong>{" "}
          (GBIF + iNaturalist) erkennt das Radar, wann Heideblüte, Kranichzug oder Herbstlaub ihren Peak
          erreichen — und meldet der DMO einen fertigen Kampagnen-Vorschlag. Dazu die{" "}
          <strong>Klima-Uhr</strong>: um wie viele Tage sich das Ereignis gegenüber 1961–1990 verschoben hat.
        </p>
      </header>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">Daten derzeit nicht erreichbar.</div>}
      {!data && !error && <div className="animate-pulse text-sm text-slate-500">Lade Meldedichte …</div>}

      {data && (
        <>
          {(() => {
            const sightMarkers: MapMarker[] = data.arten.flatMap((a) =>
              a.sightings
                .filter((s) => s.lat && s.lng)
                .map((s): MapMarker => ({
                  lat: s.lat,
                  lng: s.lng,
                  color: TYP_HEX[a.typ] ?? "#65a30d",
                  size: 11,
                  popupHtml: `<strong>${a.label}</strong><br>Sichtung ${s.datum ?? ""}<br>${s.ort ?? ""}`,
                }))
            );
            return sightMarkers.length > 0 ? (
              <div className="mb-6">
                <MarkerMap markers={sightMarkers} maxZoom={9} />
                <p className="mt-1 text-xs text-slate-500">
                  Aktuelle Sichtungen aus iNaturalist/GBIF (Farbe je Naturphänomen) · Karte: © OpenStreetMap
                </p>
              </div>
            ) : null;
          })()}

          <ul className="mb-6 space-y-3">
            {data.arten.map((a) => (
              <li key={a.art_key} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xl">{TYP_EMOJI[a.typ] ?? "🌿"}</span>
                  <span className="font-semibold text-slate-900">{a.label}</span>
                  <span className="text-xs text-slate-500">{a.region_label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PHASE[a.phase].cls}`}>{PHASE[a.phase].label}</span>
                  {a.kampagne_aktiv && <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase text-white">Kampagne läuft</span>}
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                  <span>Meldedichte: <strong className="tabular-nums">{a.anteil_permille} ‰</strong> ({a.zielart_14d} von {a.alle_14d} Meldungen / 14 Tage)</span>
                  <span className="flex items-center gap-1.5">Verlauf <Spark history={a.history} /></span>
                </div>
                {a.clock_delta_tage !== 0 && (
                  <p className="mt-2 text-sm">
                    <span className="font-medium text-brand">🕐 Klima-Uhr:</span>{" "}
                    {a.clock_delta_tage > 0
                      ? <>heute rund <strong>{a.clock_delta_tage} Tage früher</strong> als im Mittel 1961–1990</>
                      : <>heute rund <strong>{Math.abs(a.clock_delta_tage)} Tage später</strong> als 1961–1990</>}
                    <span className="text-xs text-slate-400"> (DWD-Phänologie)</span>
                  </p>
                )}
                {a.sightings.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {a.sightings.filter((s) => s.foto).slice(0, 8).map((s, i) => (
                      <img key={i} src={s.foto!} alt={`Sichtung ${a.label} ${s.ort}`} title={`${s.datum} · ${s.ort}`} className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" loading="lazy" />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="mb-8">
            <DisclaimerBox
              items={[
                "Content-Assistent, kein Buchungssignal: Das Radar unterstützt die Redaktion beim Timing von Kampagnen — Peak-Meldungen werden erst nach menschlicher Freigabe öffentlich markiert.",
                "Effort-normalisiert: Gemessen wird der ANTEIL der Zielart an allen Regions-Meldungen, nicht die absolute Zahl — das korrigiert den Beobachter-/Tourismus-Bias von Citizen-Science-Daten.",
                "Die Klima-Uhr vergleicht die DWD-Phänologie-Referenz 1961–1990 mit den letzten Jahren — eine belastbare Verschiebungs-Aussage je Art, keine tagesaktuelle Prognose.",
                "Naturschutz: Bei sensiblen Arten (Rastplätze) nur kuratierte Beobachtungspunkte kommunizieren, mit Ranger/NABU abstimmen.",
                "Datenquellen: GBIF & iNaturalist (Meldungen), DWD-Phänologie (Klima-Uhr, CC-BY).",
              ]}
            />
          </div>
        </>
      )}

      <AboutSection mailSubject="Saison-Radar" />
    </main>
  );
}
