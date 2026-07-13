"use client";

import { useState } from "react";
import { usePolling } from "@/lib/usePolling";
import AmpelBadge, { type AmpelLevel } from "@/components/AmpelBadge";
import DisclaimerBox from "@/components/DisclaimerBox";
import AboutSection from "@/components/AboutSection";

type Monat = { m: number; pv: number; last: number; ev: number };
type Result = {
  ort: string;
  bundesland: string;
  betrieb: string;
  kapazitaet: number;
  saison: string;
  kwp: number;
  last_jahr_kwh: number;
  last_geschaetzt: boolean;
  pv_jahr_kwh: number;
  monate: Monat[];
  ev_quote_prozent: number;
  autarkie_prozent: number;
  fit: AmpelLevel;
  co2_jahr_kg: number;
  co2_pro_nacht_g: number | null;
  uebernachtungen_geschaetzt: number;
  invest_spanne_eur: [number, number];
  ersparnis_spanne_eur: [number, number];
  amortisation_spanne_jahre: [number | null, number | null];
  kataster_url: string | null;
  kein_kataster: boolean;
  balkon_pv_hinweis: boolean;
  radiation_db: string;
};

const BETRIEBE = [
  { key: "hotel_garni", label: "Hotel garni" },
  { key: "hotel_kueche", label: "Hotel mit Küche/Wellness" },
  { key: "pension", label: "Pension" },
  { key: "camping", label: "Campingplatz" },
  { key: "camping_pool", label: "Campingplatz mit Pool" },
  { key: "ferienhof", label: "Ferienhof" },
  { key: "fewo", label: "Ferienwohnung(en)" },
];
const KAP_LABEL: Record<string, string> = {
  hotel_garni: "Zimmer", hotel_kueche: "Zimmer", pension: "Zimmer",
  camping: "Stellplätze", camping_pool: "Stellplätze", ferienhof: "Wohneinheiten", fewo: "Wohnungen",
};
const SAISONS = [
  { key: "ganzjahr", label: "Ganzjahresbetrieb" },
  { key: "verlaengert", label: "Saison April–Oktober" },
  { key: "sommer", label: "Sommersaison" },
];
const FIT_LABEL: Record<string, string> = { gruen: "sehr guter PV-Fit", gelb: "solider PV-Fit", rot: "PV-Fit prüfen" };
const MON = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

// Zwei Serien (PV-Erzeugung, Strombedarf) als gruppierte Monatsbalken.
// Farben folgen der Entität; Legende + Tooltip je Balken.
function MonatsChart({ monate }: { monate: Monat[] }) {
  const max = Math.max(...monate.map((m) => Math.max(m.pv, m.last)), 1);
  const W = 560, H = 190, padL = 8, padB = 18, bw = 16, grp = (W - padL) / 12;
  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="PV-Erzeugung und Strombedarf je Monat">
        {monate.map((m, i) => {
          const x = padL + i * grp + grp / 2;
          const hPv = ((H - padB - 6) * m.pv) / max;
          const hLa = ((H - padB - 6) * m.last) / max;
          return (
            <g key={m.m}>
              <rect x={x - bw - 1} y={H - padB - hPv} width={bw} height={Math.max(1, hPv)} rx="3" fill="#d97706">
                <title>{`Monat ${m.m}: PV ${m.pv} kWh`}</title>
              </rect>
              <rect x={x + 1} y={H - padB - hLa} width={bw} height={Math.max(1, hLa)} rx="3" fill="#475569">
                <title>{`Monat ${m.m}: Bedarf ${m.last} kWh`}</title>
              </rect>
              <text x={x} y={H - 4} textAnchor="middle" fontSize="10" fill="#94a3b8">{MON[i]}</text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-600" /> PV-Erzeugung</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-600" /> Strombedarf (Saisonprofil)</span>
      </div>
    </div>
  );
}

export default function SolarCheckPage() {
  const [address, setAddress] = useState("");
  const [betrieb, setBetrieb] = useState("pension");
  const [kapazitaet, setKapazitaet] = useState(15);
  const [saison, setSaison] = useState("verlaengert");
  const [token, setToken] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const { status, result, errorMessage } = usePolling<Result>(token);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setStartError(null);
    setToken(null);
    try {
      const res = await fetch("/api/solar/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, betrieb, kapazitaet, saison }),
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
        <h1 className="mb-2 text-3xl font-bold text-brand">☀️ Gastgeber-Solar-Check</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Der PV-Check, der wie ein Tourismusbetrieb rechnet: dein <strong>Saison-Lastprofil</strong>{" "}
          (Belegung statt Stromrechnung) trifft die Monats-Erzeugung deines Standorts —
          sommerlastiger Betrieb + Sommer-Sonne = oft ein idealer Fit. Funktioniert auch dort,
          wo es kein Landes-Solarkataster gibt (MV, SH, ST).
        </p>
      </header>

      <form onSubmit={start} className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <label className="mb-1 block text-sm font-medium text-slate-700">Adresse des Betriebs</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="z. B. Strandstraße 1, Zingst"
          required
          minLength={2}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Betriebstyp</label>
            <select
              value={betrieb}
              onChange={(e) => setBetrieb(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            >
              {BETRIEBE.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{KAP_LABEL[betrieb]}</label>
            <input
              type="number"
              min={1}
              max={2000}
              value={kapazitaet}
              onChange={(e) => setKapazitaet(parseInt(e.target.value) || 1)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            />
          </div>
        </div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Saisonprofil</label>
        <div className="mb-4 flex flex-wrap gap-2">
          {SAISONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSaison(s.key)}
              className={`rounded-full px-3 py-1.5 text-sm ring-1 transition ${
                saison === s.key ? "bg-brand text-white ring-brand" : "bg-white text-slate-700 ring-slate-300 hover:ring-brand-accent"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={running}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent disabled:opacity-50"
        >
          {running ? "Berechne …" : "Solar-Check starten"}
        </button>
        {startError && <p className="mt-2 text-sm text-red-700">{startError}</p>}
        {(status === "error" || status === "timeout" || status === "not_found") && (
          <p className="mt-2 text-sm text-red-700">{errorMessage ?? "Fehler bei der Berechnung — bitte erneut versuchen."}</p>
        )}
      </form>

      {running && <div className="mb-8 animate-pulse text-sm text-slate-500">Frage PVGIS (EU-Kommission) ab …</div>}

      {r && status === "done" && (
        <>
          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Ergebnis</h2>
              <AmpelBadge level={r.fit} label={FIT_LABEL[r.fit] ?? r.fit} />
            </div>
            <p className="mb-4 text-xs text-slate-500">{r.ort} · angenommene Anlage: {r.kwp} kWp · Strahlungsdaten: {r.radiation_db}</p>
            <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">PV-Ertrag/Jahr</div>
                <div className="text-lg font-semibold tabular-nums text-slate-900">{r.pv_jahr_kwh.toLocaleString("de-DE")} kWh</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Eigenverbrauchsquote</div>
                <div className="text-lg font-semibold tabular-nums text-slate-900">{r.ev_quote_prozent} %</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">CO₂-Ersparnis/Jahr</div>
                <div className="text-lg font-semibold tabular-nums text-slate-900">{(r.co2_jahr_kg / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} t</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">CO₂ pro Übernachtung</div>
                <div className="text-lg font-semibold tabular-nums text-slate-900">{r.co2_pro_nacht_g != null ? `${r.co2_pro_nacht_g} g` : "–"}</div>
              </div>
            </div>
            <MonatsChart monate={r.monate} />
            <p className="mt-3 text-sm text-slate-700">
              Amortisation: <strong>{r.amortisation_spanne_jahre[0]}–{r.amortisation_spanne_jahre[1]} Jahre</strong>{" "}
              <span className="text-xs text-slate-500">
                (Invest {r.invest_spanne_eur[0].toLocaleString("de-DE")}–{r.invest_spanne_eur[1].toLocaleString("de-DE")} €,
                Ersparnis {r.ersparnis_spanne_eur[0].toLocaleString("de-DE")}–{r.ersparnis_spanne_eur[1].toLocaleString("de-DE")} €/Jahr)
              </span>
            </p>
            {r.last_geschaetzt && (
              <p className="mt-1 text-xs text-slate-500">
                Strombedarf geschätzt aus {r.kapazitaet} {KAP_LABEL[r.betrieb]} × Branchen-Benchmark ({r.last_jahr_kwh.toLocaleString("de-DE")} kWh/Jahr).
              </p>
            )}
          </section>

          {r.balkon_pv_hinweis && (
            <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-slate-700">
              <strong>Balkon-PV-Pfad für Ferienwohnungen:</strong> Pro Wohnung sind Steckersolar-Geräte bis
              800 W ohne große Installation möglich — senkt Nebenkosten je Einheit und ist ein sichtbares
              Nachhaltigkeits-Signal für Gäste.
            </section>
          )}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
            <h2 className="mb-2 font-semibold text-slate-900">Nächster Schritt</h2>
            {r.kataster_url ? (
              <p>
                Dein Bundesland ({r.bundesland}) hat ein amtliches Solarkataster mit Dach-genauer
                Verschattungsanalyse:{" "}
                <a className="text-brand-accent underline-offset-2 hover:underline" href={r.kataster_url} target="_blank" rel="noopener noreferrer">
                  zum Landes-Solarkataster
                </a>. Danach: Angebote von 2–3 Fachbetrieben.
              </p>
            ) : (
              <p>
                {r.bundesland} hat <strong>kein Landes-Solarkataster</strong> — genau dafür ist dieser
                Vorab-Check gedacht. Nächster Schritt: Vor-Ort-Einschätzung durch 2–3 Fachbetriebe
                (Dachstatik, Verschattung, Zählerschrank).
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">Deine Daten werden nicht an Installateure verkauft.</p>
          </section>

          <div className="mb-8">
            <DisclaimerBox
              items={[
                "Grobe Vorab-Schätzung ohne Dachgeometrie und Verschattung — ersetzt keine Fachplanung.",
                "Eigenverbrauch = Monats-Matching × Gleichzeitigkeitsfaktor 0,65 (PV liefert tags, Verbrauch teils abends) — bewusst konservative Näherung ohne Lastgangmessung.",
                "CO₂-Rechnung: PV-Ertrag × 0,380 kg/kWh (dt. Strommix, UBA-Näherung) — kein Audit-Nachweis, kein Herkunftsnachweis-Zertifikat.",
                "Wirtschaftlichkeit als Spanne mit sichtbaren Annahmen (1.300–1.600 €/kWp, 28–34 ct/kWh Bezug, 7,9 ct Einspeisung) — Preise ändern sich.",
                "Datenquelle: PVGIS (EU-Kommission, Joint Research Centre), keyless.",
              ]}
            />
          </div>
        </>
      )}

      <AboutSection mailSubject="Gastgeber-Solar-Check" />
    </main>
  );
}
