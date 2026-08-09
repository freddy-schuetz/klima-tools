"use client";

import { use, useEffect, useState } from "react";
import Monatsmatrix, { type MatrixT } from "@/components/report/Monatsmatrix";
import SaisonExposition, { type SaisonExpositionT } from "@/components/report/SaisonExposition";
import Analogon, { type AnalogonT } from "@/components/report/Analogon";
import { SzenarienPaar, type WertT } from "@/components/report/Kennzahl";
import { Luecken, Quellenverzeichnis, Validierungstabelle, type QuelleT, type ValidierungT } from "@/components/report/Methodik";

type Saisonmonat = { monat: number; name: string; anteil: number; anteil_min: number; anteil_max: number };

type ReportJson = {
  erstellt: string;
  destination: {
    name: string; bundesland: string; kreis?: string; nuts3?: string;
    typ?: string; hoehe_m?: number;
  };
  profil: Record<string, unknown>;
  kapitel: {
    zusammenfassung: { text: string; richtung: "chance" | "risiko" | "neutral" }[];
    heute: {
      saisonprofil: { verfuegbar: boolean; grund?: string; monate?: Saisonmonat[]; gini?: number;
                      spitzenmonat?: { name: string; anteil: number }; methodik?: string };
      jahresreihe: { jahr: number; uebernachtungen: number | null }[];
      hinweis: string;
    };
    zukunft: Record<string, { label: string; einheit: string; werte: WertT[] }>;
    matrix: { verfuegbar: boolean; verschneidungen?: (MatrixT | SaisonExpositionT)[]; grund?: string };
    segmente: { aktiv: string[]; typ?: string; titel?: string; leitfrage?: string; text?: string };
    analogon: AnalogonT;
    naechste_schritte: { titel?: string; text?: string; schritte?: string[]; anschluss?: string };
    massnahmen: unknown[];
    methodik: {
      quellen: QuelleT[];
      validierung: ValidierungT[];
      limitationen: string[];
      luecken: string[];
    };
  };
  pflichthinweise: Record<string, string>;
};

type Antwort = { status: string; ergebnis?: ReportJson; fehler?: string; error?: string };

export default function TiefenReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [antwort, setAntwort] = useState<Antwort | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    let aktiv = true;
    // Der Report wird asynchron gebaut — bis "fertig" alle 4 s nachfragen.
    const holen = async () => {
      try {
        const res = await fetch(`/api/klimafit/report/${token}`, { cache: "no-store" });
        const data: Antwort = await res.json();
        if (!aktiv) return;
        if (!res.ok) { setFehler(data.error ?? "nicht erreichbar"); return; }
        setAntwort(data);
        if (data.status === "wartet" || data.status === "laeuft") setTimeout(holen, 4000);
      } catch {
        if (aktiv) setFehler("nicht erreichbar");
      }
    };
    holen();
    return () => { aktiv = false; };
  }, [token]);

  if (fehler) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
          Report nicht abrufbar ({fehler}). Bitte prüfen Sie den Link oder wenden Sie sich an den Absender.
        </div>
      </main>
    );
  }

  if (!antwort || antwort.status === "wartet" || antwort.status === "laeuft") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="animate-pulse text-sm text-slate-600">
          Der Tiefen-Report wird zusammengestellt. Das kann einige Minuten dauern — die Seite
          aktualisiert sich selbst.
        </p>
      </main>
    );
  }

  if (antwort.status === "fehler" || !antwort.ergebnis) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
          Der Report konnte nicht erstellt werden. {antwort.fehler ?? ""}
        </div>
      </main>
    );
  }

  const r = antwort.ergebnis;
  const k = r.kapitel;
  const d = r.destination;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 print:max-w-none print:px-0">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-accent">
          Destinations-Klimacheck · Tiefen-Report
        </p>
        <h1 className="mb-1 text-3xl font-bold text-brand">{d.name}</h1>
        <p className="text-sm text-slate-600">
          {d.bundesland}
          {d.kreis && ` · ${d.kreis}`}
          {d.hoehe_m != null && ` · ${d.hoehe_m} m ü. NN`}
          {d.typ && ` · ${d.typ}`}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Erstellt am {new Date(r.erstellt).toLocaleDateString("de-DE")} ·{" "}
          {r.pflichthinweise.positionierung}
        </p>
      </header>

      <Luecken luecken={k.methodik.luecken} />

      {/* 1 — Klimaprofil auf einen Blick */}
      {k.zusammenfassung.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-bold text-brand">1 · Klimaprofil auf einen Blick</h2>
          <ul className="space-y-2">
            {k.zusammenfassung.map((b, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <span
                  className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    b.richtung === "chance" ? "bg-sky-600" : b.richtung === "risiko" ? "bg-orange-500" : "bg-slate-400"
                  }`}
                />
                <span className="text-sm text-slate-800">{b.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 2 — Ihre Destination heute (nur Beobachtung) */}
      <section className="mb-10">
        <h2 className="mb-1 text-xl font-bold text-brand">2 · Ihre Destination heute</h2>
        <p className="mb-3 text-sm text-slate-600">
          Nur gemessene Werte — bevor irgendein Modell zu Wort kommt.
        </p>
        {k.heute.saisonprofil.verfuegbar ? (
          <Saisonkurve profil={k.heute.saisonprofil} />
        ) : (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-200">
            Saisonkurve noch nicht verfügbar: {k.heute.saisonprofil.grund}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">{k.heute.hinweis}</p>
      </section>

      {/* 3 — Klimazukunft in zwei Szenarien */}
      {Object.keys(k.zukunft).length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 text-xl font-bold text-brand">3 · Klimazukunft in zwei Szenarien</h2>
          <p className="mb-4 text-sm text-slate-600">{r.pflichthinweise.szenarien}</p>
          {Object.entries(k.zukunft).map(([key, gruppe]) => (
            <SzenarienPaar key={key} titel={gruppe.label} werte={gruppe.werte} />
          ))}
        </section>
      )}

      {/* 5 — Chancen-/Risiko-Matrix */}
      {k.matrix.verfuegbar && k.matrix.verschneidungen && (
        <section className="mb-10">
          <h2 className="mb-1 text-xl font-bold text-brand">
            5 · Wo trifft der Klimawandel Ihre Saisonkurve?
          </h2>
          <p className="mb-4 text-sm text-slate-600">{r.pflichthinweise.exposition}</p>
          {/* Zwei Formen: echte Monatsrechnung, sonst die saisonale Zuordnung. */}
          <SaisonExposition
            eintraege={k.matrix.verschneidungen.filter(
              (m): m is SaisonExpositionT => (m as SaisonExpositionT).art === "saisonal",
            )}
          />
          {k.matrix.verschneidungen
            .filter((m): m is MatrixT => (m as SaisonExpositionT).art !== "saisonal")
            .map((m, i) => (
              <Monatsmatrix key={i} matrix={m} />
            ))}
        </section>
      )}

      {/* 7 — Klima-Analogon */}
      {k.analogon?.verfuegbar && (
        <section className="mb-10">
          <h2 className="mb-1 text-xl font-bold text-brand">7 · Wo liegt Ihr Klima-Zwilling?</h2>
          <Analogon analogon={k.analogon} />
        </section>
      )}

      {/* 9 — Nächste Schritte */}
      {k.naechste_schritte?.titel && (
        <section className="mb-10 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-2 text-xl font-bold text-brand">9 · {k.naechste_schritte.titel}</h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-700">{k.naechste_schritte.text}</p>
          <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
            {(k.naechste_schritte.schritte ?? []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <p className="text-xs text-slate-500">{k.naechste_schritte.anschluss}</p>
        </section>
      )}

      {/* 10 — Methodik */}
      <section className="mb-10 border-t border-slate-200 pt-6">
        <h2 className="mb-3 text-xl font-bold text-brand">So haben wir gerechnet</h2>

        <h3 className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Validierung
        </h3>
        <Validierungstabelle zeilen={k.methodik.validierung} />

        <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Quellen
        </h3>
        <Quellenverzeichnis quellen={k.methodik.quellen} />

        <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Grenzen der Aussage
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {k.methodik.limitationen.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Saisonkurve({ profil }: { profil: NonNullable<ReportJson["kapitel"]["heute"]["saisonprofil"]> }) {
  const monate = profil.monate ?? [];
  const max = Math.max(...monate.map((m) => m.anteil_max), 0.01);
  return (
    <figure className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-end gap-1" role="img" aria-label="Saisonkurve der Übernachtungen">
        {monate.map((m) => (
          <div key={m.monat} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative flex h-32 w-full items-end">
              {/* graue Spannweite der Einzeljahre hinter dem Medianbalken */}
              <div
                className="absolute bottom-0 w-full rounded-t bg-slate-200"
                style={{ height: `${(m.anteil_max / max) * 100}%` }}
              />
              <div
                className="relative w-full rounded-t bg-brand-accent"
                style={{ height: `${(m.anteil / max) * 100}%` }}
                title={`${m.name}: ${(m.anteil * 100).toFixed(1)} % (Spanne ${(m.anteil_min * 100).toFixed(1)}–${(m.anteil_max * 100).toFixed(1)} %)`}
              />
            </div>
            <span className="text-[10px] text-slate-500">{m.name.slice(0, 3)}</span>
          </div>
        ))}
      </div>
      <figcaption className="mt-3 space-y-1 text-xs text-slate-600">
        <p>
          Spitzenmonat: <strong>{profil.spitzenmonat?.name}</strong> mit{" "}
          {((profil.spitzenmonat?.anteil ?? 0) * 100).toFixed(1)} % der Jahresübernachtungen ·
          Saisonalität (Gini): {profil.gini}
        </p>
        <p className="text-slate-500">
          Grüner Balken = Median, graue Fläche = Spannweite der Einzeljahre. {profil.methodik}
        </p>
      </figcaption>
    </figure>
  );
}
