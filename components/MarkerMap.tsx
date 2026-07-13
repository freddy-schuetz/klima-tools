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
  height = 380,
  maxZoom = 11,
}: {
  markers: MapMarker[];
  height?: number;
  maxZoom?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || markers.length === 0) return;
    const b = new maplibregl.LngLatBounds();
    for (const m of markers) b.extend([m.lng, m.lat]);
    const map = new maplibregl.Map({
      container: ref.current,
      style: STYLE,
      bounds: b,
      fitBoundsOptions: { padding: 45, maxZoom },
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
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
  }, [markers, maxZoom]);

  return <div ref={ref} style={{ height }} className="w-full overflow-hidden rounded-2xl ring-1 ring-slate-200" />;
}
