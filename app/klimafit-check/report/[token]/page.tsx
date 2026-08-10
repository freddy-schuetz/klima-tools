/**
 * Tiefen-Report — zweistufig.
 *
 * Oben ein Kurzreport, der ohne Klick auskommt und die drei Fragen beantwortet,
 * die eine Geschäftsführung stellt: Was passiert bereits? Wo trifft es uns? Was
 * tun wir? Darunter dieselben Aussagen mit allen Belegen, Tabellen und der
 * Methodik — aufgeklappt nur, wer sie sehen will, und im Druck automatisch.
 *
 * Die Auswahl für den Kurzteil ist bewusst datengetrieben und nicht
 * redaktionell: die Kennzahlen mit der stärksten bereits gemessenen Veränderung,
 * die Expositionen mit dem größten betroffenen Übernachtungsanteil. So bleibt
 * die Reihenfolge über alle Destinationen begründbar.
 */
"use client";

import { use, useEffect, useMemo, useState } from "react";
import ExpositionsUebersicht from "@/components/report/ExpositionsUebersicht";
import SaisonExposition, { type SaisonExpositionT } from "@/components/report/SaisonExposition";
import Analogon, { type AnalogonT } from "@/components/report/Analogon";
import { type WertT } from "@/components/report/Kennzahl";
import Kennzahlentabelle from "@/components/report/Kennzahlentabelle";
import {
  Luecken,
  Quellenverzeichnis,
  Validierungstabelle,
  type QuelleT,
  type ValidierungT,
} from "@/components/report/Methodik";
import Zeitstrahl, { type ZeitstrahlT } from "@/components/report/Zeitstrahl";
import HerleitungDrei, { type VerschneidungT } from "@/components/report/HerleitungDrei";
import Aufklappbar from "@/components/report/Aufklappbar";
import { einheitImSatz } from "@/lib/klartext";
import { Fahrplan, MassnahmeKarte, type MassnahmenkapitelT } from "@/components/report/Massnahmen";

type Saisonmonat = { monat: number; name: string; anteil: number; anteil_min: number; anteil_max: number };
type Saisonprofil = {
  verfuegbar: boolean;
  grund?: string;
  monate?: Saisonmonat[];
  gini?: number;
  spitzenmonat?: { name: string; anteil: number };
  methodik?: string;
};

type ReportJson = {
  erstellt: string;
  /** Amtlicher Gemeindeschlüssel — zwei Stellen bedeuten: ein ganzes Bundesland. */
  ags: string;
  destination: {
    name: string;
    bundesland: string;
    kreis?: string;
    nuts3?: string;
    typ?: string;
    hoehe_m?: number;
  };
  profil: Record<string, unknown>;
  kapitel: {
    zusammenfassung: { text: string; richtung: "chance" | "risiko" | "neutral" }[];
    zeitstrahlen?: ZeitstrahlT[];
    heute: {
      saisonprofil: Saisonprofil;
      jahresreihe: { jahr: number; uebernachtungen: number | null }[];
      hinweis: string;
    };
    zukunft: Record<string, { label: string; einheit: string; werte: WertT[] }>;
    matrix: {
      verfuegbar: boolean;
      verschneidungen?: (VerschneidungT | SaisonExpositionT)[];
      grund?: string;
      /** Woher die Aussagen „Was das im Betrieb heißt" stammen. */
      wirkung_herkunft?: string;
    };
    segmente: { aktiv: string[]; typ?: string; titel?: string; leitfrage?: string; text?: string };
    analogon: AnalogonT;
    benchmark?: { verfuegbar: boolean; hinweis?: string };
    naechste_schritte: { titel?: string; text?: string; schritte?: string[]; anschluss?: string };
    massnahmen: MassnahmenkapitelT;
    methodik: {
      quellen: QuelleT[];
      glossar?: Record<string, { name: string; erklaerung: string; fach: string; einheit: string }>;
      validierung: ValidierungT[];
      limitationen: string[];
      luecken: string[];
      konventionen?: string[];
    };
  };
  pflichthinweise: Record<string, string>;
};

type Antwort = { status: string; ergebnis?: ReportJson; fehler?: string; error?: string };

const TYP_LABEL: Record<string, string> = {
  mittelgebirge: "Mittelgebirge",
  alpin: "Alpenraum",
  kueste: "Küste",
  flachland: "Flachland",
  stadt: "Stadt",
};

/** Wie viele Elemente der Kurzreport zeigt, bevor der Rest in den Detailteil wandert. */
const KURZ_ZEITSTRAHLEN = 3;
const KURZ_MONATLICH = 2;
const KURZ_SAISONAL = 4;

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
        if (!res.ok) {
          setFehler(data.error ?? "nicht erreichbar");
          return;
        }
        setAntwort(data);
        if (data.status === "wartet" || data.status === "laeuft") setTimeout(holen, 4000);
      } catch {
        if (aktiv) setFehler("nicht erreichbar");
      }
    };
    holen();
    return () => {
      aktiv = false;
    };
  }, [token]);

  const r = antwort?.ergebnis;

  // Auswahl für den Kurzteil — memoisiert, damit das Nachladen sie nicht jedes Mal neu sortiert.
  const auswahl = useMemo(() => {
    if (!r) return null;
    const strahlen = r.kapitel.zeitstrahlen ?? [];
    const monatlich = (r.kapitel.matrix.verschneidungen ?? []).filter(
      (m): m is VerschneidungT => (m as SaisonExpositionT).art !== "saisonal",
    );
    const saisonal = (r.kapitel.matrix.verschneidungen ?? []).filter(
      (m): m is SaisonExpositionT => (m as SaisonExpositionT).art === "saisonal",
    );

    // Je Kennzahl nur die stärkste Verschneidung in den Kurzteil; sonst steht
    // dieselbe Aussage viermal da (zwei Szenarien x zwei Zeitfenster).
    const staerkste = new Map<string, VerschneidungT>();
    for (const v of monatlich) {
      const gewicht = (e: VerschneidungT) =>
        (e.summe?.exponierter_anteil_chance ?? 0) + (e.summe?.exponierter_anteil_risiko ?? 0);
      const bisher = staerkste.get(v.indikator);
      if (!bisher || gewicht(v) > gewicht(bisher)) staerkste.set(v.indikator, v);
    }
    const monatsgewicht = (e: VerschneidungT) =>
      e.summe.exponierter_anteil_chance + e.summe.exponierter_anteil_risiko;
    const kurzMonatlich = [...staerkste.values()]
      .sort((a, b) => (b.relevanz ?? 0) - (a.relevanz ?? 0) || monatsgewicht(b) - monatsgewicht(a))
      .slice(0, KURZ_MONATLICH);

    // Die saisonalen Befunde sind fuer eine Wintersportdestination die
    // wichtigsten ueberhaupt — Schnee und Beschneiung liegen ausschliesslich als
    // Jahres- bzw. Saisonwert vor. Sie gehoeren deshalb in den Kurzreport und
    // nicht in den Anhang. Gewicht: betroffener Anteil mal relative Aenderung.
    // `delta_relativ` ist null, wenn der Referenzwert 0 war — eine Division, die
    // es nicht gibt. Das als Gewicht 0 zu lesen kehrt die Aussage um: gerade der
    // Sprung von "gab es nicht" auf "gibt es" ist der drastischste Fall und
    // waere garantiert als letzter einsortiert worden. Er zaehlt deshalb als
    // volle Veraenderung.
    // Die relative Änderung wird bei 200 % gekappt. Ohne Deckel gewinnt immer
    // die Kennzahl mit der kleinsten Ausgangsbasis: Schwüle Tage gehen bei
    // Winterberg von 1,1 auf 19,3 — rechnerisch +1650 % — und schlagen damit den
    // Rückgang von 105 Skitagen auf 2. Der Prozentsatz misst dort die Kleinheit
    // der Basis, nicht die Bedeutung der Änderung.
    const gewicht = (e: SaisonExpositionT) => {
      const relativ =
        e.delta_relativ ?? (e.referenz === 0 && e.delta !== 0 ? 1 : 0);
      return (e.anteil_uebernachtungen ?? 0) * Math.min(Math.abs(relativ), 2);
    };
    const staerksteSaisonal = new Map<string, SaisonExpositionT>();
    for (const e of saisonal) {
      if (e.richtung === "neutral") continue;
      const bisher = staerksteSaisonal.get(e.indikator);
      if (!bisher || gewicht(e) > gewicht(bisher)) staerksteSaisonal.set(e.indikator, e);
    }
    const kurzSaisonal = [...staerksteSaisonal.values()]
      .sort((a, b) => (b.relevanz ?? 0) - (a.relevanz ?? 0) || gewicht(b) - gewicht(a))
      .slice(0, KURZ_SAISONAL);

    return {
      strahlen,
      kurzStrahlen: strahlen.slice(0, KURZ_ZEITSTRAHLEN),
      restStrahlen: strahlen.slice(KURZ_ZEITSTRAHLEN),
      monatlich,
      saisonal,
      kurzMonatlich,
      kurzSaisonal,
      restMonatlich: monatlich.filter((v) => !kurzMonatlich.includes(v)),
      restSaisonal: saisonal.filter((e) => !kurzSaisonal.includes(e)),
    };
  }, [r]);

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

  if (antwort.status === "fehler" || !r || !auswahl) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
          Der Report konnte nicht erstellt werden. {antwort.fehler ?? ""}
        </div>
      </main>
    );
  }

  const k = r.kapitel;
  const d = r.destination;
  const massnahmen = k.massnahmen?.massnahmen ?? [];

  // Für die Befundzeile der Maßnahmenkarten: Indikatorschlüssel zu Klartext.
  const labelJeIndikator = new Map<string, string>();
  for (const s of auswahl.strahlen) labelJeIndikator.set(s.indikator, s.label);
  for (const v of auswahl.monatlich) labelJeIndikator.set(v.indikator, v.indikator_label);
  for (const v of auswahl.saisonal) labelJeIndikator.set(v.indikator, v.indikator_label);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 print:max-w-none print:px-0 print:py-0">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-accent">
          Destinations-Klimacheck · Tiefen-Report
        </p>
        <h1 className="mb-1 text-3xl font-bold text-brand">{d.name}</h1>
        <p className="text-sm text-slate-600">
          {d.kreis && d.kreis !== d.bundesland ? `${d.bundesland} · ${d.kreis}` : d.bundesland}
          {/* Bei einem Report über ein ganzes Land ist eine Ortshöhe keine
              Information, sondern nur der Schwerpunkt der Fläche — sie bleibt
              deshalb weg. */}
          {d.hoehe_m != null && !d.kreis?.startsWith("Land ") && ` · ${d.hoehe_m} m ü. NN`}
          {d.typ && ` · ${TYP_LABEL[d.typ] ?? d.typ}`}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Erstellt am {new Date(r.erstellt).toLocaleDateString("de-DE")} · {r.pflichthinweise.positionierung}
        </p>
      </header>

      <Luecken luecken={k.methodik.luecken} />

      {/* ══════════════════════ KURZREPORT ══════════════════════ */}

      {/* 1 — Was bereits passiert ist */}
      {auswahl.kurzStrahlen.length > 0 && (
        <section className="mb-10">
          {/* Ein Bundesland hat keinen Landkreis. Der Zeitstrahl selbst sagt
              unter der Grafik schon das Richtige („Flächenmittel des Landes");
              diese Zeile war der letzte Ort mit fester Annahme. */}
          <Kapitelkopf
            nummer={1}
            titel="Das ist bereits passiert"
            unterzeile={`Gemessene Werte des Deutschen Wetterdienstes für ${
              r.ags.length <= 2 ? "Ihr Bundesland" : "Ihren Landkreis"
            } — 1951 bis heute, danach die Modellbandbreite.`}
          />
          {auswahl.kurzStrahlen.map((s) => (
            <Zeitstrahl key={s.indikator} strahl={s} />
          ))}
          {auswahl.restStrahlen.length > 0 && (
            <Aufklappbar
              titel="Weitere Kennzahlen im Zeitverlauf"
              unterzeile="dieselbe Darstellung für die übrigen Indikatoren"
              anzahl={auswahl.restStrahlen.length}
            >
              {auswahl.restStrahlen.map((s) => (
                <Zeitstrahl key={s.indikator} strahl={s} />
              ))}
            </Aufklappbar>
          )}
        </section>
      )}

      {/* 2 — Wo es die Saison trifft */}
      {(auswahl.kurzMonatlich.length > 0 || auswahl.kurzSaisonal.length > 0) && (
        <section className="mb-10">
          <Kapitelkopf
            nummer={2}
            titel="Wo der Klimawandel Ihre Saison trifft"
            unterzeile={
              "Klimaveränderung allein sagt noch nichts über Ihr Geschäft — entscheidend ist, ob sie " +
              "in den Monaten stattfindet, in denen Ihre Gäste kommen. Deshalb wird hier beides " +
              "übereinandergelegt: Ihre Übernachtungen Monat für Monat und die Veränderung Monat für " +
              "Monat. Heraus kommt, wie viel Prozent Ihres heutigen Geschäfts überhaupt berührt ist — " +
              "und was das im Betrieb bedeutet."
            }
          />
          {auswahl.kurzMonatlich.map((v) => (
            <HerleitungDrei key={`${v.indikator}-${v.szenario}-${v.zeitfenster}`} v={v} />
          ))}
          {auswahl.kurzSaisonal.length > 0 && <SaisonExposition eintraege={auswahl.kurzSaisonal} />}
          {k.matrix.wirkung_herkunft && (
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              {k.matrix.wirkung_herkunft}
            </p>
          )}
          {(auswahl.restMonatlich.length > 0 || auswahl.restSaisonal.length > 0) && (
            <Aufklappbar
              titel="Alle Expositionen im Überblick"
              unterzeile="jede Kennzahl in beiden Szenarien und beiden Zeitfenstern"
              anzahl={auswahl.restMonatlich.length + auswahl.restSaisonal.length}
            >
              <ExpositionsUebersicht monatlich={auswahl.restMonatlich} saisonal={auswahl.restSaisonal} />
            </Aufklappbar>
          )}
        </section>
      )}

      {/* 3 — Was zu tun ist */}
      {k.massnahmen?.verfuegbar && massnahmen.length > 0 && (
        <section className="mb-10">
          <Kapitelkopf
            nummer={3}
            titel="Was Sie damit machen können"
            unterzeile="Ausgewählt zu den auffälligen Kennzahlen Ihrer Destination, sortiert nach dem, was Sie selbst anstoßen können."
          />
          <Fahrplan massnahmen={massnahmen} />
          {massnahmen.map((m) => (
            <MassnahmeKarte key={m.id} m={m} indikatorLabel={(s) => (s ? labelJeIndikator.get(s) ?? null : null)} />
          ))}
          {k.massnahmen.hinweis && (
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{k.massnahmen.hinweis}</p>
          )}
        </section>
      )}

      {/* 4 — Gremienvorlage */}
      {k.naechste_schritte?.titel && (
        <section className="mb-10 break-inside-avoid rounded-2xl bg-brand/5 p-5 ring-1 ring-brand/15">
          <h2 className="mb-2 text-xl font-bold text-brand">{k.naechste_schritte.titel}</h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-700">{k.naechste_schritte.text}</p>
          <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
            {(k.naechste_schritte.schritte ?? []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <p className="text-xs text-slate-500">{k.naechste_schritte.anschluss}</p>
        </section>
      )}

      {/* ══════════════════════ BELEGE ══════════════════════ */}

      <section className="mb-10">
        <h2 className="mb-1 text-xl font-bold text-brand">Belege und Einzelwerte</h2>
        <p className="mb-4 text-sm text-slate-600">
          Alles, was den Aussagen oben zugrunde liegt. Im Ausdruck sind diese Bereiche automatisch geöffnet.
        </p>

        {k.zusammenfassung.length > 0 && (
          <Aufklappbar titel="Kernaussagen in einer Liste" anzahl={k.zusammenfassung.length}>
            <ul className="space-y-2">
              {k.zusammenfassung.map((b, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      b.richtung === "chance" ? "bg-sky-600" : b.richtung === "risiko" ? "bg-orange-500" : "bg-slate-400"
                    }`}
                  />
                  <span className="text-sm text-slate-800">{b.text}</span>
                </li>
              ))}
            </ul>
          </Aufklappbar>
        )}

        <Aufklappbar
          titel="Ihre Saisonkurve"
          unterzeile="amtliche Beherbergungsstatistik, Median über die verfügbaren Jahrgänge"
        >
          {k.heute.saisonprofil.verfuegbar ? (
            <Saisonkurve profil={k.heute.saisonprofil} />
          ) : (
            <p className="text-sm text-slate-600">
              Saisonkurve noch nicht verfügbar: {k.heute.saisonprofil.grund}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">{k.heute.hinweis}</p>
        </Aufklappbar>

        {Object.keys(k.zukunft).length > 0 && (
          <Aufklappbar
            titel="Alle Kennzahlen mit Bandbreite je Szenario"
            unterzeile={r.pflichthinweise.szenarien}
            anzahl={Object.keys(k.zukunft).length}
          >
            <Kennzahlentabelle gruppen={k.zukunft} />
          </Aufklappbar>
        )}

        {k.segmente?.titel && (
          <Aufklappbar titel={`Einordnung für Ihren Destinationstyp: ${k.segmente.titel}`}>
            {k.segmente.leitfrage && (
              <p className="mb-2 text-sm font-medium text-brand">{k.segmente.leitfrage}</p>
            )}
            <p className="text-sm leading-relaxed text-slate-700">{k.segmente.text}</p>
          </Aufklappbar>
        )}

        {k.analogon?.verfuegbar && (
          <Aufklappbar
            titel="Ihr Klima-Zwilling"
            unterzeile="der Ort, dessen heutiges Klima dem projizierten Klima am nächsten kommt"
          >
            <Analogon analogon={k.analogon} />
          </Aufklappbar>
        )}

        {k.benchmark && !k.benchmark.verfuegbar && k.benchmark.hinweis && (
          <p className="mb-3 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600 ring-1 ring-slate-200">
            <strong>Vergleich mit anderen Destinationen: </strong>
            {k.benchmark.hinweis}
          </p>
        )}
      </section>

      {/* ══════════════════════ METHODIK ══════════════════════ */}

      <section className="mb-10 border-t border-slate-200 pt-6">
        <h2 className="mb-1 text-xl font-bold text-brand">So haben wir gerechnet</h2>
        <p className="mb-4 text-sm text-slate-600">
          Jeder Wert im Report hat eine benannte Quelle, ein benanntes Szenario und eine benannte
          Lesart seiner Bandbreite. Was fehlt, steht als Lücke drin — nicht als Schätzung.
        </p>

        {/* Die Überschriften oben dürfen lesbar sein — dafür steht hier, was
            jede Kennzahl genau zählt, mitsamt der Fachbezeichnung zum
            Nachschlagen. Sonst wäre Verständlichkeit mit Nachprüfbarkeit
            bezahlt, und das ist bei einem Gutachten der falsche Tausch. */}
        {Object.keys(k.methodik.glossar ?? {}).length > 0 && (
          <Aufklappbar
            titel="Was die Kennzahlen messen"
            anzahl={Object.keys(k.methodik.glossar ?? {}).length}
          >
            <dl className="space-y-3 text-sm">
              {Object.entries(k.methodik.glossar ?? {}).map(([schluessel, g]) => (
                <div key={schluessel}>
                  <dt className="font-semibold text-slate-800">
                    {g.name}{" "}
                    <span className="font-normal text-slate-400">
                      · {einheitImSatz(g.einheit)}
                    </span>
                  </dt>
                  <dd className="text-slate-600">
                    {g.erklaerung}
                    {g.fach !== g.name && (
                      <span className="text-slate-400"> — fachlich: {g.fach}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </Aufklappbar>
        )}

        <Aufklappbar titel="Validierung gegen amtliche Vergleichswerte" anzahl={k.methodik.validierung.length}>
          <Validierungstabelle zeilen={k.methodik.validierung} />
        </Aufklappbar>

        <Aufklappbar titel="Quellenverzeichnis" anzahl={k.methodik.quellen.length}>
          <Quellenverzeichnis quellen={k.methodik.quellen} />
        </Aufklappbar>

        <Aufklappbar titel="Grenzen der Aussage" anzahl={k.methodik.limitationen.length} offen>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
            {k.methodik.limitationen.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
          {(k.methodik.konventionen ?? []).length > 0 && (
            <>
              <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Konventionen
              </h4>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {(k.methodik.konventionen ?? []).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </Aufklappbar>
      </section>
    </main>
  );
}

function Kapitelkopf({ nummer, titel, unterzeile }: { nummer: number; titel: string; unterzeile?: string }) {
  return (
    <div className="mb-4">
      <h2 className="flex items-baseline gap-2 text-xl font-bold text-brand">
        <span className="text-brand-accent">{nummer}</span>
        {titel}
      </h2>
      {unterzeile && <p className="mt-1 text-sm leading-relaxed text-slate-600">{unterzeile}</p>}
    </div>
  );
}

function Saisonkurve({ profil }: { profil: Saisonprofil }) {
  const monate = profil.monate ?? [];
  const max = Math.max(...monate.map((m) => m.anteil_max), 0.01);
  return (
    <figure className="break-inside-avoid">
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
          {((profil.spitzenmonat?.anteil ?? 0) * 100).toFixed(1)} % der Jahresübernachtungen · Saisonalität
          (Gini): {profil.gini}
        </p>
        <p className="text-slate-500">
          Grüner Balken = Median, graue Fläche = Spannweite der Einzeljahre. {profil.methodik}
        </p>
      </figcaption>
    </figure>
  );
}
