"use client";

import { useEffect, useState } from "react";
import DisclaimerBox from "@/components/DisclaimerBox";
import AboutSection from "@/components/AboutSection";

type Region = { region: string; kultur: string; gdd: number; stadium: string; krit: number; forecast_min: number[]; risiko: boolean };
type Data = { regionen: Region[]; updated_at: string };

export default function FrostPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [address, setAddress] = useState("");
  const [kultur, setKultur] = useState("wein");
  const [email, setEmail] = useState("");
  const [aboStatus, setAboStatus] = useState<"idle" | "sending" | "ok" | "fail">("idle");
  const [aboOrt, setAboOrt] = useState("");

  useEffect(() => {
    fetch("/api/frost", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  async function abo(e: React.FormEvent) {
    e.preventDefault();
    setAboStatus("sending");
    try {
      const res = await fetch("/api/frost/abo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, kultur, email }),
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setAboOrt(d.ort ?? address);
        setAboStatus("ok");
      } else setAboStatus("fail");
    } catch {
      setAboStatus("fail");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-accent">Klima-Toolbox</p>
        <h1 className="mb-2 text-3xl font-bold text-brand">🍇 Spätfrost-Warndienst</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Wein- und Obstbau: die Warnung, die <strong>weniger Fehlalarme</strong> macht. Statt einer festen
          Temperaturschwelle schätzt der Dienst dein <strong>Entwicklungsstadium</strong> aus dem
          Temperaturverlauf und warnt nur, wenn eine Frostnacht auf eine wirklich empfindliche Phase trifft.
          Keyless, ohne eigene Wetterstation.
        </p>
      </header>

      <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Warndienst abonnieren</h2>
        <p className="mb-3 text-sm text-slate-600">Du bekommst eine Mail nur bei echter Frostgefahr für dein Stadium — und kannst das geschätzte Stadium jederzeit korrigieren.</p>
        {aboStatus === "ok" ? (
          <p className="text-sm font-medium text-emerald-700">✓ Warndienst aktiv für {aboOrt.split(",")[0]} — Bestätigung ist unterwegs (mit Abmelde-Link).</p>
        ) : (
          <form onSubmit={abo} className="grid gap-3 sm:grid-cols-2">
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Weinberg / Ort" required minLength={2}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none sm:col-span-2" />
            <select value={kultur} onChange={(e) => setKultur(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none">
              <option value="wein">Weinbau</option>
              <option value="obst">Obstbau</option>
            </select>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="deine@email.de" required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none" />
            <button type="submit" disabled={aboStatus === "sending"}
              className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent disabled:opacity-50 sm:col-span-2">
              {aboStatus === "sending" ? "Richte ein …" : "Warndienst aktivieren"}
            </button>
            {aboStatus === "fail" && <p className="text-sm text-red-700 sm:col-span-2">Fehlgeschlagen — bitte Ort/E-Mail prüfen.</p>}
          </form>
        )}
      </section>

      <section className="mb-6 overflow-x-auto rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Live-Status der Demo-Regionen</h2>
        <p className="mb-3 text-xs text-slate-500">So arbeitet der Dienst: geschätztes Stadium + 3-Nächte-Frostvorschau je Region.</p>
        {error && <p className="text-sm text-red-700">Daten derzeit nicht erreichbar.</p>}
        {!data && !error && <div className="animate-pulse text-sm text-slate-500">Lade Stadien …</div>}
        {data && (
          <table className="w-full min-w-115 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2">Region</th><th className="pb-2">Kultur</th><th className="pb-2">Stadium (geschätzt)</th>
                <th className="pb-2 text-right">kritisch ab</th><th className="pb-2 text-right">nächste 3 Nächte</th><th className="pb-2 text-right">Frostgefahr</th>
              </tr>
            </thead>
            <tbody>
              {data.regionen.map((r) => (
                <tr key={r.region} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-800">{r.region}</td>
                  <td className="py-2 text-slate-600">{r.kultur === "wein" ? "Wein" : "Obst"}</td>
                  <td className="py-2 text-slate-700">{r.stadium}</td>
                  <td className="py-2 text-right tabular-nums text-slate-600">{r.krit} °C</td>
                  <td className="py-2 text-right tabular-nums text-slate-600">{r.forecast_min.map((m) => `${m}°`).join(" ")}</td>
                  <td className="py-2 text-right">
                    {r.risiko
                      ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">Warnung</span>
                      : <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">keine</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="mb-8">
        <DisclaimerBox
          items={[
            "Das Entwicklungsstadium wird aus dem Temperaturverlauf modelliert (Wachstumsgradtage) — eine Schätzung, die du als Winzer/Obstbauer bestätigen oder korrigieren kannst; dann warnt der Dienst präziser.",
            "Kritische Temperaturen je Stadium sind eine dokumentierte Heuristik (u. a. nach FrostStrat / Landwirtschaftskammern) — im Frühjahr (Austrieb bis Blüte) ist die Stadien-Kopplung am wertvollsten.",
            "Regionale Näherung aus Wettermodell-Daten, NICHT parzellengenau — lokale Kaltluftseen können deutlich kälter sein als die Flächenvorhersage.",
            "Kein Ersatz für eigene Messung oder amtliche Warnung; der Dienst unterstützt die Entscheidung, er trifft sie nicht.",
            "Datenquelle: Open-Meteo (Archiv + Vorhersage), keyless.",
          ]}
        />
      </div>

      <AboutSection mailSubject="Spätfrost-Warndienst" />
    </main>
  );
}
