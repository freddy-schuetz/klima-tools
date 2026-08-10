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
 *
 * Die Rückgabe trägt ihren Artikel selbst, damit sie in „Er ist heute …" passt:
 * „Hauptsaison" braucht keinen, „ein gut gebuchter Monat" schon.
 */
export function monatsrolle(anteil: number): string {
  if (anteil >= 0.115) return "Hauptsaison";
  if (anteil >= 0.075) return "ein gut gebuchter Monat";
  if (anteil >= 0.05) return "Schultersaison";
  return "Nebensaison";
}

/**
 * Einheit im Satz statt als Kürzel: „96 Tage im Jahr" liest sich, „96
 * Tage/Winter" muss man übersetzen.
 *
 * Vier Formen, weil ein Satz alle vier braucht. Der Dativ, damit „ein Plus von
 * 18 Tagen" nicht als „ein Plus von 18 Tage" endet. Und die Kurzform, weil der
 * Bezugsrahmen nur einmal gesagt werden muss: „Heute sind es 1,1 Tage im Jahr,
 * im Szenario 19,3 Tage — ein Plus von 18,2 Tagen." Dreimal „im Jahr" im selben
 * Satz liest sich wie ein Formular.
 * Gegenstück zu EINHEIT_IM_SATZ in app/report/klartext.py.
 */
type Einheit = { kurz: string; kurzD: string; ez: string; zusatz: string };

const EINHEITEN: Record<string, Einheit> = {
  "Tage/Jahr": { kurz: "Tage", kurzD: "Tagen", ez: "Tag", zusatz: " im Jahr" },
  "Tage/Winter": { kurz: "Tage", kurzD: "Tagen", ez: "Tag", zusatz: " je Winter" },
  "Nächte/Jahr": { kurz: "Nächte", kurzD: "Nächten", ez: "Nacht", zusatz: " im Jahr" },
  "Stunden/Jahr": { kurz: "Stunden", kurzD: "Stunden", ez: "Stunde", zusatz: " im Jahr" },
  Tage: { kurz: "Tage", kurzD: "Tagen", ez: "Tag", zusatz: "" },
  Nächte: { kurz: "Nächte", kurzD: "Nächten", ez: "Nacht", zusatz: "" },
  Stunden: { kurz: "Stunden", kurzD: "Stunden", ez: "Stunde", zusatz: "" },
  "°C": { kurz: "Grad", kurzD: "Grad", ez: "Grad", zusatz: "" },
  "%": { kurz: "Prozent", kurzD: "Prozent", ez: "Prozent", zusatz: "" },
  "mm/Tag": { kurz: "Millimeter", kurzD: "Millimetern", ez: "Millimeter", zusatz: " am Tag" },
  "kg/m²": { kurz: "Kilogramm", kurzD: "Kilogramm", ez: "Kilogramm", zusatz: " je Quadratmeter" },
  "m/s": { kurz: "Meter", kurzD: "Metern", ez: "Meter", zusatz: " je Sekunde" },
};

export function einheitImSatz(
  kuerzel: string,
  fall: "nominativ" | "dativ" = "nominativ",
  form: "lang" | "kurz" = "lang",
  einzahl = false,
): string {
  const e = EINHEITEN[kuerzel];
  if (!e) return kuerzel;
  const basis = einzahl ? e.ez : fall === "dativ" ? e.kurzD : e.kurz;
  return form === "lang" ? basis + e.zusatz : basis;
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
