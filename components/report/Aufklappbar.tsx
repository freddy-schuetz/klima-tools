/**
 * Aufklappbarer Detailbereich.
 *
 * Der Report soll alles Belegbare enthalten, aber nicht alles gleichzeitig
 * zeigen. Auf dem Bildschirm bleibt der Beleg deshalb zugeklappt; im Druck
 * werden alle Bereiche geöffnet, damit das PDF vollständig ist — das erledigt
 * die Regel `details { display: block }` in `print.css` zusammen mit dem
 * `open`-Attribut, das der Druckdialog nicht setzen kann.
 */
"use client";

import { useEffect, useRef } from "react";

export default function Aufklappbar({
  titel,
  unterzeile,
  anzahl,
  children,
  offen = false,
}: {
  titel: string;
  unterzeile?: string;
  anzahl?: number;
  children: React.ReactNode;
  offen?: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    // Vor dem Druck aufklappen, danach den vorherigen Zustand wiederherstellen.
    // Ohne das fehlen im PDF genau die Belege, die den Report tragen.
    const el = ref.current;
    if (!el) return;
    let vorher = el.open;
    const auf = () => {
      vorher = el.open;
      el.open = true;
    };
    const zu = () => {
      el.open = vorher;
    };
    window.addEventListener("beforeprint", auf);
    window.addEventListener("afterprint", zu);
    return () => {
      window.removeEventListener("beforeprint", auf);
      window.removeEventListener("afterprint", zu);
    };
  }, []);

  return (
    <details
      ref={ref}
      open={offen}
      className="group mb-3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 print:shadow-none"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 print:hidden">
        <span>
          <span className="text-sm font-semibold text-brand">{titel}</span>
          {unterzeile && <span className="block text-xs text-slate-500">{unterzeile}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {anzahl != null && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{anzahl}</span>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            aria-hidden
            className="text-slate-400 transition-transform group-open:rotate-180"
          >
            <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
      </summary>
      {/* Im Druck steht die Überschrift sichtbar statt der Klapp-Zeile. */}
      <h3 className="hidden px-4 pt-3 text-base font-semibold text-brand print:block">{titel}</h3>
      <div className="border-t border-slate-100 px-4 py-4 print:border-t-0">{children}</div>
    </details>
  );
}
