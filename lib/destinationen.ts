// Vorberechnete Destinationen des Quick-Checks.
//
// Der Check laeuft bewusst NUR auf dieser Liste: Bei freier Ortseingabe gehen pro
// Anfrage rund hundert gewichtete Aufrufe an den Wetterdienst, und die Serveradresse
// laeuft dabei regelmaessig ins Rate-Limit — der Nutzer sieht dann einen Fehler statt
// eines Ergebnisses. Fuer diese Orte liegt das Ergebnis dauerhaft im Cache.
//
// Die Koordinaten stammen aus dem Cache-Eintrag selbst und werden mitgeschickt, damit
// auch der Geocoding-Dienst nicht mehr angefragt werden muss.

export type Destination = {
  ort: string;
  bundesland: string;
  typ: "bade" | "wander" | "winter" | "stadt";
  lat: number;
  lng: number;
};

export const DESTINATIONEN: Destination[] = [
  { ort: "Cuxhaven", bundesland: "Niedersachsen", typ: "bade", lat: 53.8688, lng: 8.6983 },
  { ort: "Sankt Peter-Ording", bundesland: "Schleswig-Holstein", typ: "bade", lat: 54.3173, lng: 8.6255 },
  { ort: "Scharbeutz", bundesland: "Schleswig-Holstein", typ: "bade", lat: 54.0266, lng: 10.7559 },
  { ort: "Garmisch-Partenkirchen", bundesland: "Bayern", typ: "wander", lat: 47.4924, lng: 11.0963 },
  { ort: "Hallstatt", bundesland: "Oberösterreich", typ: "wander", lat: 47.5348, lng: 13.5989 },
  { ort: "Kitzbühel", bundesland: "Tirol", typ: "wander", lat: 47.4464, lng: 12.3911 },
  { ort: "Mayrhofen", bundesland: "Tirol", typ: "wander", lat: 47.1672, lng: 11.8639 },
  { ort: "St. Moritz", bundesland: "Graubünden/Grischun/Grigioni", typ: "wander", lat: 46.4979, lng: 9.8392 },
  { ort: "Zell am See", bundesland: "Salzburg", typ: "wander", lat: 47.324, lng: 12.7963 },
  { ort: "Zermatt", bundesland: "Valais/Wallis", typ: "wander", lat: 46.0212, lng: 7.7493 },
  { ort: "Garmisch-Partenkirchen", bundesland: "Bayern", typ: "winter", lat: 47.4924, lng: 11.0963 },
  { ort: "Ischgl", bundesland: "Tirol", typ: "winter", lat: 47.012, lng: 10.2913 },
  { ort: "Kitzbühel", bundesland: "Tirol", typ: "winter", lat: 47.4464, lng: 12.3911 },
  { ort: "Bamberg", bundesland: "Bayern", typ: "stadt", lat: 49.8916, lng: 10.8868 },
  { ort: "Berlin", bundesland: "Berlin", typ: "stadt", lat: 52.5174, lng: 13.3951 },
  { ort: "Essen", bundesland: "Nordrhein-Westfalen", typ: "stadt", lat: 51.4582, lng: 7.0158 },
  { ort: "Goslar", bundesland: "Niedersachsen", typ: "stadt", lat: 51.906, lng: 10.4266 },
  { ort: "Heidelberg", bundesland: "Baden-Württemberg", typ: "stadt", lat: 49.4094, lng: 8.6947 },
  { ort: "Innsbruck", bundesland: "Tirol", typ: "stadt", lat: 47.2654, lng: 11.3928 },
  { ort: "Lübeck", bundesland: "Schleswig-Holstein", typ: "stadt", lat: 53.8664, lng: 10.6847 },
  { ort: "Regensburg", bundesland: "Bayern", typ: "stadt", lat: 49.0195, lng: 12.0975 },
  { ort: "Rothenburg ob der Tauber", bundesland: "Bayern", typ: "stadt", lat: 49.3658, lng: 10.1629 },
  { ort: "Salzburg", bundesland: "Salzburg", typ: "stadt", lat: 47.7981, lng: 13.0465 },
  { ort: "Trier", bundesland: "Rheinland-Pfalz", typ: "stadt", lat: 49.7596, lng: 6.6442 },
  { ort: "Wien", bundesland: "Wien", typ: "stadt", lat: 48.2084, lng: 16.3725 },
];

export const TYP_LABEL: Record<Destination["typ"], string> = {
  bade: "🏖️ Badedestination",
  wander: "🥾 Wander- und Raddestination",
  winter: "⛷️ Winterdestination",
  stadt: "🏙️ Städtedestination",
};

/** Reihenfolge der Gruppen im Auswahlfeld. */
export const TYP_REIHENFOLGE: Destination["typ"][] = ["bade", "wander", "winter", "stadt"];
