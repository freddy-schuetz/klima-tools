// Pflicht-Komponente je Tool: ehrliches Framing der Datengrundlage und Grenzen.
// Jedes Klima-Tool MUSS eine DisclaimerBox unter dem Ergebnis rendern —
// die Aussagen sind Orientierung/Screening, kein Gutachten und keine amtliche Warnung.
export default function DisclaimerBox({ title = "Was dieses Tool kann — und was nicht", items }: { title?: string; items: string[] }) {
  return (
    <aside className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-slate-700">
      <div className="mb-2 flex items-center gap-2 font-semibold text-amber-900">
        <span aria-hidden>⚖️</span>
        {title}
      </div>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}
