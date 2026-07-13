// Geteilte Ampel-Anzeige für alle Klima-Tools (Pegel, Waldbrand, Grünstrom, Frost).
export type AmpelLevel = "gruen" | "gelb" | "rot" | "grau";

const STYLES: Record<AmpelLevel, { dot: string; chip: string }> = {
  gruen: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  gelb: { dot: "bg-amber-400", chip: "bg-amber-50 text-amber-800 ring-amber-200" },
  rot: { dot: "bg-red-500", chip: "bg-red-50 text-red-800 ring-red-200" },
  grau: { dot: "bg-slate-400", chip: "bg-slate-50 text-slate-600 ring-slate-200" },
};

export default function AmpelBadge({ level, label }: { level: AmpelLevel; label: string }) {
  const s = STYLES[level];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.chip}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
      {label}
    </span>
  );
}
