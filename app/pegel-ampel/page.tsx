"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import AmpelBadge, { type AmpelLevel } from "@/components/AmpelBadge";
import DisclaimerBox from "@/components/DisclaimerBox";
import AboutSection from "@/components/AboutSection";
import Sparkline from "@/components/Sparkline";
import type { MapMarker } from "@/components/MarkerMap";

const MarkerMap = dynamic(() => import("@/components/MarkerMap"), {
  ssr: false,
  loading: () => <div className="flex h-[380px] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">Karte lädt …</div>,
});

type Abschnitt = {
  abschnitt: string;
  aktivitaet: "kanu" | "faehre" | string;
  ampel: AmpelLevel;
  pegel_cm: number | null;
  station_name: string;
  station_lat: number | null;
  station_lng: number | null;
  km_von: number;
  km_bis: number;
  gemessen_um: string;
  sparkline: [string, number][];
};

const AMPEL_HEX: Record<string, string> = { gruen: "#10b981", gelb: "#f59e0b", rot: "#ef4444", grau: "#94a3b8" };

type PegelData = {
  abschnitte: Abschnitt[];
  updated_at: string;
  fluss: string;
  hinweis: string;
};

const AMPEL_LABEL: Record<string, string> = {
  gruen: "gut machbar",
  gelb: "eingeschränkt",
  rot: "kritisch niedrig",
  grau: "keine Daten",
};

const FAEHRE_LABEL: Record<string, string> = {
  gruen: "Betrieb wahrscheinlich",
  gelb: "Einschränkung möglich",
  rot: "Ausfall wahrscheinlich",
  grau: "keine Daten",
};

function fmtZeit(iso: string) {
  if (!iso) return "–";
  try {
    return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(0, 16);
  }
}

function Row({ a, faehre }: { a: Abschnitt; faehre: boolean }) {
  const labels = faehre ? FAEHRE_LABEL : AMPEL_LABEL;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900">{a.abschnitt}</span>
          <AmpelBadge level={a.ampel} label={labels[a.ampel] ?? a.ampel} />
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          {faehre ? `Elbe-km ${a.km_von}` : `Elbe-km ${a.km_von}–${a.km_bis}`}
          {" · "}Pegel {a.station_name}
          {" · "}gemessen {fmtZeit(a.gemessen_um)}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-right text-sm font-semibold tabular-nums text-slate-900">
          {a.pegel_cm != null ? `${a.pegel_cm} cm` : "–"}
        </span>
        <Sparkline points={a.sparkline} label={a.abschnitt} />
      </div>
    </li>
  );
}

export default function PegelAmpelPage() {
  const [data, setData] = useState<PegelData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/pegel", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const kanu = data?.abschnitte.filter((a) => a.aktivitaet === "kanu") ?? [];
  const faehren = data?.abschnitte.filter((a) => a.aktivitaet === "faehre") ?? [];
  const counts = { gruen: 0, gelb: 0, rot: 0, grau: 0 } as Record<string, number>;
  data?.abschnitte.forEach((a) => { counts[a.ampel] = (counts[a.ampel] ?? 0) + 1; });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-accent">Klima-Toolbox</p>
        <h1 className="mb-2 text-3xl font-bold text-brand">🚣 Pegel-Ampel Elbe</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Niedrigwasser wird durch den Klimawandel häufiger — und trifft Kanuverleiher, SUP-Touren und
          Gierseilfähren am Elberadweg zuerst. Diese Ampel übersetzt die amtlichen{" "}
          <a href="https://www.pegelonline.wsv.de" target="_blank" rel="noopener noreferrer" className="text-brand-accent underline-offset-2 hover:underline">
            PEGELONLINE
          </a>
          -Wasserstände stündlich in eine Übersicht je Streckenabschnitt.
        </p>
      </header>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
          Daten derzeit nicht erreichbar — bitte später erneut versuchen.
        </div>
      )}
      {!data && !error && <div className="animate-pulse text-sm text-slate-500">Lade aktuelle Pegel …</div>}

      {data && (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <AmpelBadge level="gruen" label={`${counts.gruen} gut`} />
            <AmpelBadge level="gelb" label={`${counts.gelb} eingeschränkt`} />
            <AmpelBadge level="rot" label={`${counts.rot} kritisch`} />
            <span className="ml-auto">Stand: {fmtZeit(data.updated_at)} · stündliche Aktualisierung</span>
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Karte</h2>
            <MarkerMap
              markers={data.abschnitte
                .filter((a): a is Abschnitt & { station_lat: number; station_lng: number } => a.station_lat != null && a.station_lng != null)
                .map((a): MapMarker => ({
                  lat: a.station_lat,
                  lng: a.station_lng,
                  color: AMPEL_HEX[a.ampel] ?? "#94a3b8",
                  size: a.aktivitaet === "faehre" ? 11 : 15,
                  popupHtml: `<strong>${a.abschnitt}</strong><br>${a.aktivitaet === "faehre" ? "Fähre" : "Kanu/SUP"} · ${(a.aktivitaet === "faehre" ? FAEHRE_LABEL : AMPEL_LABEL)[a.ampel] ?? a.ampel}<br>Pegel ${a.station_name}: ${a.pegel_cm ?? "–"} cm`,
                }))}
            />
            <p className="mt-1 text-xs text-slate-500">
              Marker = Pegelstationen (große Punkte: Streckenabschnitte, kleine: Fähren) · Farbe = aktuelle Ampel · Karte: © OpenStreetMap
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Streckenabschnitte (Kanu / SUP)
            </h2>
            <ul className="space-y-2">
              {kanu.map((a) => <Row key={a.abschnitt} a={a} faehre={false} />)}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Fähren am Elberadweg
            </h2>
            <ul className="space-y-2">
              {faehren.map((a) => <Row key={a.abschnitt} a={a} faehre={true} />)}
            </ul>
          </section>

          <div className="mb-8">
            <DisclaimerBox
              items={[
                "Die Ampel ist eine Orientierungshilfe auf Basis amtlicher Pegelstände — keine Befahrbarkeits-Garantie und kein Ersatz für lokale Auskünfte.",
                "Die Schwellenwerte je Abschnitt sind kuratierte Demo-Werte; für den Produktivbetrieb werden sie mit Kanuverband, Fährbetrieben und DMO validiert.",
                "Der Fähren-Status ist eine Pegel-Heuristik, kein amtlicher Betriebsstatus — verbindlich informiert nur der Fährbetreiber.",
                "Datenquelle: PEGELONLINE (WSV), minutenaktuell und frei zugänglich. 7-Tage-Verlauf je Messstation.",
              ]}
            />
          </div>
        </>
      )}

      <AboutSection mailSubject="Pegel-Ampel" />
    </main>
  );
}
