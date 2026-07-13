import Link from "next/link";
import AboutSection from "@/components/AboutSection";

type Tool = {
  href: string;
  emoji: string;
  title: string;
  text: string;
  live?: boolean;
};

const CLUSTERS: { title: string; tools: Tool[] }[] = [
  {
    title: "Wasser & Wald",
    tools: [
      { href: "/pegel-ampel", emoji: "🚣", title: "Pegel-Ampel", text: "Niedrigwasser-Ampel für Flusstourismus: Kanu, SUP & Fähren — minutenaktuell aus PEGELONLINE.", live: true },
      { href: "/waldbrand-radar", emoji: "🔥", title: "Waldbrand-Radar", text: "Tägliche Gefahrenstufe je Wanderregion + Satelliten-Hotspots + Alternativ-Touren.", live: true },
    ],
  },
  {
    title: "Klima-Checks",
    tools: [
      { href: "/klimafit-check", emoji: "🌡️", title: "Klimafit-Destination-Check", text: "Hitzetage, Frosttage, Saisonfenster: Trend seit 1950 + Projektion 2050 für deinen Ort." },
      { href: "/solar-vorabcheck", emoji: "☀️", title: "Solar-Vorabcheck", text: "Grobes PV-Potenzial, Jahresertrag und CO₂-Ersparnis für jede Adresse." },
    ],
  },
  {
    title: "Energie & Kommune",
    tools: [
      { href: "/gruenstrom-ampel", emoji: "⚡", title: "Grüne-Strom-Ampel", text: "Jetzt laden oder später? Lastverschiebung in grüne + günstige Stunden, mit CO₂-Monatsreport." },
      { href: "/hitze-briefing", emoji: "🏙️", title: "Hitze-Briefing", text: "Wo trifft Hitze auf Verwundbarkeit? Satelliten-Hitzeinseln × Kitas, Pflegeheime, Spielplätze." },
    ],
  },
  {
    title: "Natur & Agrar",
    tools: [
      { href: "/saison-radar", emoji: "🌸", title: "Saison-Radar", text: "Heideblüte, Kranichzug & Co.: der echte Naturkalender aus Live-Sichtungen — und wie er sich verschiebt." },
      { href: "/frost-warndienst", emoji: "🍇", title: "Spätfrost-Warndienst", text: "Frostnächte in der Blühphase: Warnungen für Wein- und Obstbau." },
    ],
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-accent">Klima-Toolbox</p>
        <h1 className="mb-3 text-3xl font-bold text-brand sm:text-4xl">
          KI &amp; Automatisierung gegen Klimafolgen
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600">
          Acht Tools für Destinationen, Kommunen, Betriebe und Naturschutz — gebaut auf offenen Daten
          (DWD, PEGELONLINE, Copernicus, GBIF, Fraunhofer Energy-Charts). Amtliche Daten sind da;
          diese Tools bringen sie zu den Menschen, die handeln müssen.
        </p>
      </header>

      {CLUSTERS.map((cluster) => (
        <section key={cluster.title} className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">{cluster.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {cluster.tools.map((tool) =>
              tool.live ? (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-brand-accent"
                >
                  <div className="mb-2 text-2xl">{tool.emoji}</div>
                  <div className="mb-1 font-semibold text-slate-900 group-hover:text-brand">{tool.title}</div>
                  <p className="text-sm leading-relaxed text-slate-600">{tool.text}</p>
                </Link>
              ) : (
                <div key={tool.href} className="rounded-2xl bg-white/60 p-5 ring-1 ring-slate-200">
                  <div className="mb-2 text-2xl opacity-60">{tool.emoji}</div>
                  <div className="mb-1 flex items-center gap-2 font-semibold text-slate-500">
                    {tool.title}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      in Arbeit
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-500">{tool.text}</p>
                </div>
              )
            )}
          </div>
        </section>
      ))}

      <div className="mt-12">
        <AboutSection mailSubject="Klima-Toolbox" />
      </div>
    </main>
  );
}
