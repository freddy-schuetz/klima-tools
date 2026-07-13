"use client";

import { useEffect, useState } from "react";
import DisclaimerBox from "@/components/DisclaimerBox";
import AboutSection from "@/components/AboutSection";

type Region = {
  region: string;
  bundesland: string;
  station_name: string;
  stufe_heute: number;
  stufe_morgen: number;
  forecast: number[];
  termin: string;
  banner_aktiv: boolean;
  hotspots_48h: number | null;
};

type WaldbrandData = {
  regionen: Region[];
  updated_at: string;
  hinweis: string;
};

// DWD-Waldbrandgefahrenindex: 5 amtliche Stufen. Sequentielle Schwere-Skala,
// Stufe steht IMMER als Zahl+Text dabei — nie Farbe allein.
const STUFEN: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: "sehr geringe Gefahr", bg: "bg-emerald-100", text: "text-emerald-900" },
  2: { label: "geringe Gefahr", bg: "bg-lime-100", text: "text-lime-900" },
  3: { label: "mittlere Gefahr", bg: "bg-amber-200", text: "text-amber-900" },
  4: { label: "hohe Gefahr", bg: "bg-orange-400", text: "text-orange-950" },
  5: { label: "sehr hohe Gefahr", bg: "bg-red-600", text: "text-white" },
};

function StufeBadge({ stufe }: { stufe: number }) {
  const s = STUFEN[stufe] ?? { label: "unbekannt", bg: "bg-slate-100", text: "text-slate-600" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
      Stufe {stufe} · {s.label}
    </span>
  );
}

function ForecastBand({ forecast }: { forecast: number[] }) {
  const days = ["heute", "+1", "+2", "+3", "+4", "+5", "+6"];
  return (
    <div className="flex gap-1" role="img" aria-label={`7-Tage-Vorhersage: Stufen ${forecast.join(", ")}`}>
      {forecast.map((st, i) => {
        const s = STUFEN[st] ?? { bg: "bg-slate-100", text: "text-slate-600", label: "" };
        return (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span
              title={`${days[i]}: Stufe ${st} (${s.label})`}
              className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold ${s.bg} ${s.text}`}
            >
              {st}
            </span>
            <span className="text-[9px] text-slate-400">{days[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function WaldbrandRadarPage() {
  const [data, setData] = useState<WaldbrandData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/waldbrand", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const hoch = data?.regionen.filter((r) => r.stufe_heute >= 4) ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-accent">Klima-Toolbox</p>
        <h1 className="mb-2 text-3xl font-bold text-brand">🔥 Waldbrand-Radar</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Längere Dürrephasen machen Waldbrände zur wachsenden Gefahr für Wanderregionen. Dieses Radar
          übersetzt den amtlichen{" "}
          <a href="https://www.dwd.de/DE/leistungen/waldbrandgef/waldbrandgef.html" target="_blank" rel="noopener noreferrer" className="text-brand-accent underline-offset-2 hover:underline">
            DWD-Waldbrandgefahrenindex
          </a>{" "}
          täglich in eine 7-Tage-Übersicht je Region — und liefert der Redaktion bei Stufe 4+
          ein fertiges Warnbanner zur Freigabe.
        </p>
      </header>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
          Daten derzeit nicht erreichbar — bitte später erneut versuchen.
        </div>
      )}
      {!data && !error && <div className="animate-pulse text-sm text-slate-500">Lade Gefahrenstufen …</div>}

      {data && (
        <>
          {hoch.length > 0 && (
            <div className="mb-6 rounded-xl border border-orange-300 bg-orange-50 p-4 text-sm text-orange-950">
              <span className="font-semibold">⚠️ Hohe Waldbrandgefahr heute:</span>{" "}
              {hoch.map((r) => r.region).join(", ")} — bitte regionale Hinweise beachten, offenes Feuer
              und Rauchen im Wald unterlassen.
            </div>
          )}

          <ul className="mb-8 space-y-2">
            {data.regionen.map((r) => (
              <li key={r.region} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{r.region}</span>
                      <StufeBadge stufe={r.stufe_heute} />
                      {r.banner_aktiv && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
                          Warnbanner aktiv
                        </span>
                      )}
                      {(r.hotspots_48h ?? 0) > 0 && (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          🛰️ {r.hotspots_48h} aktive{r.hotspots_48h === 1 ? "s" : ""} Feuer (48 h)
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {r.bundesland} · DWD-Station {r.station_name}
                      {r.hotspots_48h != null && r.hotspots_48h === 0 && " · keine Satelliten-Hotspots (48 h)"}
                    </div>
                  </div>
                  <ForecastBand forecast={r.forecast} />
                </div>
              </li>
            ))}
          </ul>

          <div className="mb-8">
            <DisclaimerBox
              items={[
                "Der Waldbrandgefahrenindex (WBI) des DWD ist ein meteorologischer Index — KEINE amtliche Warnung und keine Wegesperrung. Verbindlich informieren Landesbehörden und Nationalparkverwaltungen.",
                "Warnbanner werden nie automatisch veröffentlicht: Bei Stufe 4+ erhält die Redaktion eine Freigabe-Mail; erst nach Klick geht das Banner live. Fällt die Stufe unter 4, deaktiviert es sich automatisch.",
                "Jede Region wird über eine repräsentative DWD-Station abgebildet — kleinräumige Unterschiede (Exposition, Totholz) bildet der Index nicht ab.",
                "Datenquellen: DWD Open Data (CC-BY, täglich gegen 04:20 Uhr, Vorhersage heute + 6 Tage) und NASA FIRMS (aktive Feuer aus VIIRS-Satellitendaten, letzte 48 h, Umkreis 30 km). Satelliten erfassen nur ausreichend große/heiße Feuer — 0 Hotspots ist kein Unbedenklichkeits-Nachweis.",
              ]}
            />
          </div>
        </>
      )}

      <AboutSection mailSubject="Waldbrand-Radar" />
    </main>
  );
}
