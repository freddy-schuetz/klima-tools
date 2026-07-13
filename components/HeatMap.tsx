"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

export type Facility = {
  kategorie: string;
  label: string;
  name: string;
  lat: number;
  lon: number;
  lst_perzentil: number | null;
  score: number | null;
};
type Corners = [[number, number], [number, number], [number, number], [number, number]];
export type Overlay = { image_path: string; coordinates: Corners; tmin: number; tmax: number } | null;

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
      attribution: "© OpenStreetMap-Mitwirkende © CARTO · Hitzelayer: Landsat/USGS via MS Planetary Computer",
    },
  },
  layers: [{ id: "base", type: "raster", source: "base" }],
};

// Score-Skala (sequentiell) für Marker
function scoreColor(score: number | null) {
  if (score == null) return "#94a3b8";
  if (score >= 70) return "#b91c1c";
  if (score >= 55) return "#ea580c";
  if (score >= 40) return "#f59e0b";
  return "#65a30d";
}

export default function HeatMap({
  bbox,
  overlay,
  facilities,
}: {
  bbox: { s: number; w: number; n: number; e: number };
  overlay: Overlay;
  facilities: Facility[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: STYLE,
      bounds: [[bbox.w, bbox.s], [bbox.e, bbox.n]],
      fitBoundsOptions: { padding: 30 },
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      if (overlay?.image_path) {
        const key = overlay.image_path.split("/").pop()?.replace(".png", "") ?? "";
        map.addSource("heat", { type: "image", url: `/api/hitze/img?key=${encodeURIComponent(key)}`, coordinates: overlay.coordinates });
        map.addLayer({ id: "heat", type: "raster", source: "heat", paint: { "raster-opacity": 0.6 } });
      }
      for (const f of facilities) {
        const el = document.createElement("div");
        const r = f.score != null && f.score >= 55 ? 16 : 12;
        el.style.cssText = `width:${r}px;height:${r}px;border-radius:50%;background:${scoreColor(f.score)};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);cursor:pointer`;
        new maplibregl.Marker({ element: el })
          .setLngLat([f.lon, f.lat])
          .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(
            `<strong>${f.name}</strong><br>${f.label}<br>Hitze-Perzentil: ${f.lst_perzentil ?? "–"} · Score: ${f.score ?? "–"}`
          ))
          .addTo(map);
      }
    });
    return () => map.remove();
  }, [bbox, overlay, facilities]);

  return <div ref={ref} className="h-[440px] w-full overflow-hidden rounded-2xl ring-1 ring-slate-200" />;
}
