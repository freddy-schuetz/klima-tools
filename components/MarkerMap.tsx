"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

// Generische OSM-Marker-Karte für die Klima-Tools (Pegel, Waldbrand, Saison, Frost).
// Farbe folgt dem Status der Entität; Identität steht immer auch im Popup-Text.
export type MapMarker = {
  lat: number;
  lng: number;
  color: string;
  size?: number;        // px, default 13
  popupHtml?: string;
  ring?: boolean;       // weißer Ring (default true)
};

/** Punkt für die Glut-/Heatmap-Darstellung (z. B. Feuer-Wärmesignale). weight ~ Intensität (FRP). */
export type HeatPoint = { lat: number; lng: number; weight?: number };

const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    base: {
      type: "raster",
      tileSize: 256,
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      ],
      attribution: "© OpenStreetMap-Mitwirkende © CARTO",
    },
  },
  layers: [{ id: "base", type: "raster", source: "base" }],
};

export default function MarkerMap({
  markers,
  heat,
  height = 380,
  maxZoom = 11,
}: {
  markers: MapMarker[];
  /** Feuer-/Wärmepunkte: werden als glühende Heatmap-Fläche gerendert (klar unterscheidbar von den Marker-Punkten). */
  heat?: HeatPoint[];
  height?: number;
  maxZoom?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || (markers.length === 0 && !(heat && heat.length))) return;
    const b = new maplibregl.LngLatBounds();
    for (const m of markers) b.extend([m.lng, m.lat]);
    for (const h of heat ?? []) b.extend([h.lng, h.lat]);
    const map = new maplibregl.Map({
      container: ref.current,
      style: STYLE,
      bounds: b,
      fitBoundsOptions: { padding: 45, maxZoom },
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    // Glut-Layer: Heatmap + heller Kern — visuell klar anders als die Stufen-Marker
    if (heat && heat.length) {
      map.on("load", () => {
        const maxW = Math.max(...heat.map((h) => h.weight ?? 1), 1);
        map.addSource("feuer", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: heat.map((h) => ({
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: [h.lng, h.lat] },
              properties: { w: (h.weight ?? 1) / maxW },
            })),
          },
        });
        map.addLayer({
          id: "feuer-glut",
          type: "heatmap",
          source: "feuer",
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "w"], 0, 0.35, 1, 1],
            "heatmap-intensity": 1.1,
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 6, 26, 11, 60],
            "heatmap-opacity": 0.85,
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(0,0,0,0)",
              0.2, "rgba(254,240,138,0.55)",
              0.45, "rgba(251,146,60,0.75)",
              0.7, "rgba(239,68,68,0.85)",
              1, "rgba(153,27,27,0.95)",
            ],
          },
        });
        // heller Kern, damit die Quelle punktgenau erkennbar bleibt
        map.addLayer({
          id: "feuer-kern",
          type: "circle",
          source: "feuer",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 2.5, 11, 5],
            "circle-color": "#fff7ed",
            "circle-opacity": 0.9,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#b91c1c",
          },
        });
      });
    }

    for (const m of markers) {
      const el = document.createElement("div");
      const s = m.size ?? 13;
      el.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;background:${m.color};` +
        `${m.ring === false ? "" : "border:2px solid #fff;"}box-shadow:0 1px 3px rgba(0,0,0,.35);cursor:pointer`;
      const marker = new maplibregl.Marker({ element: el }).setLngLat([m.lng, m.lat]);
      if (m.popupHtml) marker.setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(m.popupHtml));
      marker.addTo(map);
    }
    return () => map.remove();
  }, [markers, heat, maxZoom]);

  return <div ref={ref} style={{ height }} className="w-full overflow-hidden rounded-2xl ring-1 ring-slate-200" />;
}
