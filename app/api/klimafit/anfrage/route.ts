import { makeStartHandler } from "@/lib/n8nProxy";

// Profil-Formular des Tiefen-Reports: reicht die Eingaben an den
// Freischaltungs-Workflow durch. Der legt den Auftrag im Compute-Backend an und
// schickt den Link, sobald der Report steht.
export const maxDuration = 30;
export const POST = makeStartHandler("klimafit-tiefenreport-start");
