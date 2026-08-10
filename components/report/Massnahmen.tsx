/**
 * Handlungsempfehlungen — der Teil, wegen dem eine DMO den Report überhaupt liest.
 *
 * Bisher standen die Maßnahmen als kurze Liste ganz unten. Hier bekommen sie den
 * Raum, der ihrem Stellenwert entspricht: zuerst ein Fahrplan über die drei
 * Zeithorizonte als Überblick, darunter je Maßnahme eine Karte mit der
 * vollständigen Begründungskette.
 *
 *   Befund  →  Maßnahme  →  wer setzt das um  →  wo läuft es schon
 *
 * Der letzte Schritt ist der wichtigste und zugleich der heikelste: ein
 * Fallbeispiel wird nur ausgespielt, wenn sein Beleg beim Kuratieren erreichbar
 * war. Erfundene Referenzen wären das Ende der Glaubwürdigkeit des Reports.
 */
"use client";

export type MassnahmeT = {
  id: string;
  titel: string;
  beschreibung: string;
  zeithorizont: string | null;
  traegerschaft: string | null;
  traegerschaft_label: string;
  trigger_indikator: string | null;
  trigger_schwelle: string | null;
  dtv_handlungsfeld: string | null;
  hinweis: string | null;
  quelle: { titel: string | null; url: string | null; jahr: string | null };
  fallbeispiel: { ort: string | null; text: string | null; url: string | null } | null;
};

export type MassnahmenkapitelT = {
  verfuegbar: boolean;
  anzahl?: number;
  hinweis?: string;
  massnahmen?: MassnahmeT[];
  bestand_gesamt?: number;
  auffaellige_indikatoren?: string[];
  grund?: string;
};

const HORIZONTE = [
  { schluessel: "sofort", titel: "Sofort", unterzeile: "in dieser Saison beginnen" },
  { schluessel: "1-5 Jahre", titel: "1 bis 5 Jahre", unterzeile: "Haushalt und Partner einplanen" },
  { schluessel: "strategisch", titel: "Strategisch", unterzeile: "Positionierung und Investitionen" },
] as const;

const TRAEGER_FARBE: Record<string, string> = {
  dmo: "bg-brand text-white",
  dmo_mit_kommune: "bg-brand-accent text-white",
  betriebe: "bg-sky-100 text-sky-900",
  kommune: "bg-amber-100 text-amber-900",
  land_bund: "bg-slate-200 text-slate-700",
};

export function Fahrplan({ massnahmen }: { massnahmen: MassnahmeT[] }) {
  return (
    <div className="mb-6 break-inside-avoid rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 print:shadow-none">
      <div className="grid gap-4 md:grid-cols-3">
        {HORIZONTE.map((h, i) => {
          const eintraege = massnahmen.filter((m) => (m.zeithorizont ?? "") === h.schluessel);
          return (
            <div key={h.schluessel} className="relative">
              {/* Zeitachse: gefüllter Punkt plus Verbindungslinie zur nächsten Station */}
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-3 w-3 shrink-0 rounded-full bg-brand-accent" />
                {i < HORIZONTE.length - 1 && <span className="hidden h-px flex-1 bg-slate-200 md:block" />}
              </div>
              <p className="text-sm font-bold text-brand">{h.titel}</p>
              <p className="mb-2 text-[11px] text-slate-500">{h.unterzeile}</p>
              {eintraege.length === 0 ? (
                <p className="text-xs text-slate-400">nichts zugeordnet</p>
              ) : (
                <ol className="space-y-1.5">
                  {eintraege.map((m) => (
                    <li key={m.id}>
                      <a
                        href={`#massnahme-${m.id}`}
                        className="block rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs leading-snug text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                      >
                        {m.titel}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MassnahmeKarte({
  m,
  indikatorLabel,
}: {
  m: MassnahmeT;
  indikatorLabel: (schluessel: string | null) => string | null;
}) {
  const befund = indikatorLabel(m.trigger_indikator);
  return (
    <article
      id={`massnahme-${m.id}`}
      className="mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 print:shadow-none"
    >
      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Befund</p>
        <p className="text-sm text-slate-700">
          {befund ? (
            <>
              <strong className="text-brand">{befund}</strong>
              {m.trigger_schwelle && <> — {m.trigger_schwelle}</>}
            </>
          ) : (
            "Querschnittsmaßnahme — unabhängig von einer einzelnen Kennzahl sinnvoll."
          )}
        </p>
      </div>

      <div className="px-4 py-3">
        <h4 className="mb-1.5 text-base font-semibold text-brand">{m.titel}</h4>
        <p className="text-sm leading-relaxed text-slate-700">{m.beschreibung}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              TRAEGER_FARBE[m.traegerschaft ?? "dmo"] ?? "bg-slate-200 text-slate-700"
            }`}
          >
            {m.traegerschaft_label}
          </span>
          {m.zeithorizont && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
              {HORIZONTE.find((h) => h.schluessel === m.zeithorizont)?.titel ?? m.zeithorizont}
            </span>
          )}
          {m.dtv_handlungsfeld && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
              DTV-Handlungsfeld: {m.dtv_handlungsfeld}
            </span>
          )}
        </div>

        {m.fallbeispiel?.text && (
          // Der farbige Streifen an der Kante ist weg: Der Kasten hebt sich
          // schon durch Fläche und Überschrift ab, und die Überschrift trägt
          // die Farbe. Zwei Träger derselben Auszeichnung sind einer zu viel.
          <div className="mt-3 rounded-xl bg-emerald-50/60 px-3 py-2.5 ring-1 ring-emerald-200/70">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-accent">
              Wo das schon läuft
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              {m.fallbeispiel.ort && <strong>{m.fallbeispiel.ort}: </strong>}
              {m.fallbeispiel.text}
            </p>
            {m.fallbeispiel.url && (
              <a
                href={m.fallbeispiel.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-brand-accent underline"
              >
                Beleg ansehen
              </a>
            )}
          </div>
        )}

        {m.hinweis && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
            <strong>Zu beachten: </strong>
            {m.hinweis}
          </p>
        )}

        {m.quelle?.titel && (
          <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500">
            Quelle:{" "}
            {m.quelle.url ? (
              <a href={m.quelle.url} target="_blank" rel="noreferrer" className="underline">
                {m.quelle.titel}
              </a>
            ) : (
              m.quelle.titel
            )}
            {m.quelle.jahr && ` (${m.quelle.jahr})`}
          </p>
        )}
      </div>
    </article>
  );
}
