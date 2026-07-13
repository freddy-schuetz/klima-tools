// "Wer steckt dahinter" — adaptiert aus geo-quick-check für die Klima-Toolbox.
export default function AboutSection({ mailSubject }: { mailSubject?: string }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="md:flex">
        <div className="flex flex-col justify-center bg-gradient-to-br from-brand to-brand-accent p-8 text-white md:w-1/3">
          <div className="mb-2 text-xs uppercase tracking-wider opacity-80">Hinter dem Tool</div>
          <div className="mb-1 text-xl font-semibold">Friedemann Schütz</div>
          <div className="mb-4 text-sm opacity-90">
            (AI) Automation Expert
            <br />
            n8n Ambassador
          </div>
          <div className="border-t border-white/20 pt-3 text-xs opacity-75">Essen, Deutschland</div>
        </div>
        <div className="p-8 md:w-2/3">
          <h3 className="mb-3 font-semibold text-slate-900">Wer steckt dahinter?</h3>
          <p className="mb-3 text-sm leading-relaxed text-slate-700">
            Ich unterstütze Destinationen, Kommunen und Betriebe dabei, aus offenen Daten (DWD,
            PEGELONLINE, Copernicus, GBIF &amp; Co.) <strong>handlungsfähige Klima-Werkzeuge</strong> zu
            bauen — mit <strong>n8n-Workflows</strong>, KI-Agenten und, wo sinnvoll, auf{" "}
            <strong>eigener Infrastruktur</strong>: ohne Cloud-Zwang, datenschutzfreundlich, praxisnah.
          </p>
          <p className="mb-4 text-sm leading-relaxed text-slate-700">
            Dieses Tool ist Teil einer <strong>Klima-Toolbox</strong>: von Frühwarnung (Waldbrand, Pegel,
            Spätfrost) über Klimarisiko-Checks bis zu Grünstrom und Naturbeobachtung. Amtliche Daten sind
            exzellent — was fehlt, ist die letzte Meile zu den Menschen, die handeln müssen. Als Demo
            gebaut — als System für Ihre Region umsetzbar.
          </p>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {["Offene Daten", "n8n", "KI-Agenten", "Klimaanpassung", "Self-Hosted", "DSGVO-konform"].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-brand"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={`mailto:f.schuetz@posteo.de?subject=${encodeURIComponent(mailSubject ?? "Klima-Toolbox")}`}
              className="inline-block rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent"
            >
              Gespräch anfragen
            </a>
            <a
              href="https://friedemann-schuetz.de"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline"
            >
              Mehr auf friedemann-schuetz.de →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
