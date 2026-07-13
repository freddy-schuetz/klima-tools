"use client";

import { useEffect, useState } from "react";
import DisclaimerBox from "@/components/DisclaimerBox";
import AboutSection from "@/components/AboutSection";

type Fenster = { start: number; mittel: number; startH: number; tagesmittel: number | null; delta: number | null } | null;
type Preset = { key: string; label: string; dauer: number; kwh: number; heute_ee: Fenster; morgen_ee: Fenster; heute_preis: Fenster };
type TL = { t: number; ee: number; preis: number | null };
type Data = { presets: Preset[]; timeline: TL[]; attribution: string; hinweis: string };

function uhr(unix: number) {
  return new Date(unix * 1000).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
}
// Sequentielle Grün-Skala nach EE-Anteil (eine Hue, hell→dunkel)
function eeColor(ee: number) {
  if (ee >= 85) return "#15803d";
  if (ee >= 70) return "#22c55e";
  if (ee >= 55) return "#86efac";
  if (ee >= 40) return "#dcfce7";
  return "#f1f5f9";
}

export default function GruenstromPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [aktiv, setAktiv] = useState("waescherei");
  const [email, setEmail] = useState("");
  const [aboStatus, setAboStatus] = useState<"idle" | "sending" | "ok" | "fail">("idle");

  useEffect(() => {
    fetch("/api/gruenstrom", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  async function abo(e: React.FormEvent) {
    e.preventDefault();
    setAboStatus("sending");
    try {
      const res = await fetch("/api/gruenstrom/abo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, prozess: aktiv }),
      });
      setAboStatus(res.ok ? "ok" : "fail");
    } catch {
      setAboStatus("fail");
    }
  }

  const p = data?.presets.find((x) => x.key === aktiv) ?? data?.presets[0];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-accent">Klima-Toolbox</p>
        <h1 className="mb-2 text-3xl font-bold text-brand">⚡ Grünstrom-Fenster für Betriebe</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Keine weitere Strom-Ampel — sondern das <strong>beste zusammenhängende Zeitfenster für deinen
          Prozess</strong>: Wäscherei-Charge, Poolpumpe, E-Flotte. Ohne Smart Meter, ohne Tarifwechsel,
          ohne Hardware — wirkt auch mit Festpreis-Tarif, weil es um CO₂ geht, nicht um Cent.
        </p>
      </header>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">Daten derzeit nicht erreichbar.</div>}
      {!data && !error && <div className="animate-pulse text-sm text-slate-500">Lade EE-Prognose (Fraunhofer ISE) …</div>}

      {data && p && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {data.presets.map((x) => (
              <button
                key={x.key}
                onClick={() => setAktiv(x.key)}
                className={`rounded-full px-3 py-1.5 text-sm ring-1 transition ${
                  aktiv === x.key ? "bg-brand text-white ring-brand" : "bg-white text-slate-700 ring-slate-300 hover:ring-brand-accent"
                }`}
              >
                {x.label} ({x.dauer} h)
              </button>
            ))}
          </div>

          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            {p.heute_ee ? (
              <>
                <div className="mb-1 text-sm text-slate-500">Bestes Fenster heute für {p.label}:</div>
                <div className="mb-2 text-2xl font-bold text-brand">
                  {uhr(p.heute_ee.start)}–{uhr(p.heute_ee.start + p.dauer * 3600)} Uhr
                </div>
                <p className="text-sm text-slate-700">
                  <strong>{p.heute_ee.mittel} % Ökostrom</strong> statt {p.heute_ee.tagesmittel} % im
                  Tagesmittel (+{p.heute_ee.delta} Punkte)
                  {p.heute_preis && (
                    <span className="text-slate-500"> · günstigstes Preisfenster: {uhr(p.heute_preis.start)} Uhr ({p.heute_preis.mittel} ct/kWh Börse)</span>
                  )}
                </p>
                {p.morgen_ee && (
                  <p className="mt-1 text-xs text-slate-500">
                    Morgen: {uhr(p.morgen_ee.start)} Uhr · {p.morgen_ee.mittel} % Ökostrom
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-600">Für heute liegt noch kein vollständiges Prognosefenster vor.</p>
            )}
            <div className="mt-4">
              <div className="mb-1 text-xs text-slate-500">Ökostrom-Anteil der nächsten Stunden</div>
              <div className="flex h-8 gap-px overflow-hidden rounded" role="img" aria-label="Ökostrom-Anteil je Stunde">
                {data.timeline.map((h) => (
                  <div key={h.t} className="flex-1" style={{ backgroundColor: eeColor(h.ee) }} title={`${uhr(h.t)} Uhr: ${h.ee}% EE${h.preis != null ? `, ${h.preis} ct/kWh` : ""}`} />
                ))}
              </div>
              <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
                <span>{data.timeline.length ? `${uhr(data.timeline[0].t)} Uhr` : ""}</span>
                <span>{data.timeline.length ? `${uhr(data.timeline[data.timeline.length - 1].t)} Uhr` : ""}</span>
              </div>
            </div>
          </section>

          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Tägliche Fenster-Mail fürs Team</h2>
            <p className="mb-3 text-sm text-slate-600">
              Werktags 06:00 als Klartext an Housekeeping, Bauhof oder Technik — plus CO₂-Monatsreport
              mit fertigem Textbaustein für den Nachhaltigkeitsbericht (VSME/DNK).
            </p>
            {aboStatus === "ok" ? (
              <p className="text-sm font-medium text-emerald-700">✓ Abo aktiv — Bestätigung ist unterwegs (mit Abmelde-Link).</p>
            ) : (
              <form onSubmit={abo} className="flex flex-wrap gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="team@betrieb.de"
                  className="min-w-56 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={aboStatus === "sending"}
                  className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent disabled:opacity-50"
                >
                  {aboStatus === "sending" ? "Sende …" : `Abonnieren (${p.label})`}
                </button>
                {aboStatus === "fail" && <p className="w-full text-sm text-red-700">Fehlgeschlagen — bitte E-Mail prüfen.</p>}
              </form>
            )}
          </section>

          <div className="mb-8">
            <DisclaimerBox
              items={[
                "Deutschlandweiter Strommix (stündliche EE-Anteil-Prognose) — keine regionale oder netzdienliche Aussage. Werte über 100 % bedeuten: Erneuerbare erzeugen mehr als die Last.",
                "Empfehlung, keine Steuerung: Das Tool schaltet nichts — es sagt deinem Team, wann sich Anschalten lohnt.",
                "Börsenpreise (Day-Ahead) sind Information, keine Tarifberatung — Ersparnis in Euro gibt es nur mit dynamischem Tarif, die CO₂-Wirkung auch ohne.",
                "CO₂-Monatsreport ist eine transparente Näherung (Intensität linear über den fossilen Anteil skaliert) — kein Audit-Nachweis, kein Herkunftsnachweis-Zertifikat.",
                `${data.attribution}.`,
              ]}
            />
          </div>
        </>
      )}

      <AboutSection mailSubject="Grünstrom-Fenster" />
    </main>
  );
}
