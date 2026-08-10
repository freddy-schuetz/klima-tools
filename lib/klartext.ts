/**
 * Fachbegriffe in Sprache, die am Sitzungstisch verstanden wird.
 *
 * Gegenstück zu `app/report/klartext.py` im Backend — die Bezeichnungen müssen
 * zusammenbleiben, sonst heißt dieselbe Sache im Bild anders als in der Zeile
 * darunter, und nichts verwirrt einen Leser mehr.
 */

/** Szenario über seine Ursache benannt, nicht über seine Kennziffer. */
export const SZENARIO_SATZ: Record<string, string> = {
  rcp45: "wenn der weltweite Treibhausgas-Ausstoß ab etwa 2040 sinkt",
  rcp85: "wenn der weltweite Treibhausgas-Ausstoß weiter steigt",
  rcp26: "wenn der weltweite Treibhausgas-Ausstoß schnell und stark sinkt",
};

export const SZENARIO_KURZ: Record<string, string> = {
  rcp45: "Ausstoß sinkt ab etwa 2040",
  rcp85: "Ausstoß steigt weiter",
  rcp26: "Ausstoß sinkt schnell",
};

export const SZENARIO_FACH: Record<string, string> = {
  rcp45: "RCP4.5",
  rcp85: "RCP8.5",
  rcp26: "RCP2.6",
};

/** "2069-2098" → "Ende des Jahrhunderts". Die Jahreszahlen bleiben separat stehen. */
export function zeitraumLage(fenster: string): string {
  const jahre = fenster
    .replace("–", "-")
    .split("-")
    .map((t) => Number.parseInt(t.trim(), 10))
    .filter((n) => Number.isFinite(n));
  if (jahre.length !== 2) return fenster;
  const mitte = (jahre[0] + jahre[1]) / 2;
  if (mitte < 2035) return "in den nächsten Jahren";
  if (mitte < 2060) return "Mitte des Jahrhunderts";
  if (mitte < 2080) return "in der zweiten Jahrhunderthälfte";
  return "Ende des Jahrhunderts";
}

/**
 * Wie ein Monat für die Destination einzuordnen ist.
 * Redaktionelle Faustregeln auf den tagesnormierten Monatsanteilen; bei zwölf
 * Monaten liegt der Durchschnitt bei 8,3 Prozent.
 */
export function monatsrolle(anteil: number): string {
  if (anteil >= 0.115) return "Hauptsaison";
  if (anteil >= 0.075) return "gut gebuchter Monat";
  if (anteil >= 0.05) return "Schultersaison";
  return "Nebensaison";
}

/**
 * Große Zahlen gerundet. "348.488 Nächte" behauptet eine Genauigkeit, die eine
 * Hochrechnung aus Monatsanteilen nicht hat.
 */
export function naechte(zahl: number | null | undefined): string {
  if (zahl == null || Number.isNaN(zahl)) return "";
  if (zahl >= 10_000) return `rund ${Math.round(zahl / 1000).toLocaleString("de-DE")}.000`;
  return `rund ${Math.round(zahl / 100) * 100}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function aufzaehlung(namen: string[]): string {
  if (namen.length === 0) return "";
  if (namen.length === 1) return namen[0];
  return `${namen.slice(0, -1).join(", ")} und ${namen[namen.length - 1]}`;
}
