"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import maplibregl, { type ExpressionSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import geojson from "@/data/divisions.geo.json";

// Sequential teal ramp (lightness-monotonic, validated); dark→light = low→high.
const RAMP = ["#00565c", "#00838c", "#00b8c4", "#00f2ff"];

const fmt = new Intl.NumberFormat("en-US");

function quantileBreaks(values: number[], classes: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  return Array.from({ length: classes - 1 }, (_, i) => {
    const idx = ((i + 1) / classes) * (sorted.length - 1);
    return sorted[Math.round(idx)] ?? 0;
  });
}

export default function DivisionMap({ values }: { values: Record<string, number> }) {
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!container.current) return;

    const breaks = quantileBreaks(Object.values(values), RAMP.length);
    const colorFor = (v: number) => RAMP[breaks.filter((b) => v > b).length] ?? RAMP[0];
    const matchExpr = [
      "match",
      ["get", "code"],
      ...Object.entries(values).flatMap(([code, v]) => [code, colorFor(v)]),
      "#31353c", // no data
    ] as unknown as ExpressionSpecification;

    const map = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: "bg", type: "background", paint: { "background-color": "#10141a" } }],
      },
      bounds: [
        [87.9, 20.5],
        [92.8, 26.7],
      ],
      fitBoundsOptions: { padding: 24 },
      attributionControl: false,
      dragRotate: false,
    });

    map.on("load", () => {
      map.addSource("divisions", { type: "geojson", data: geojson as GeoJSON.GeoJSON });
      map.addLayer({
        id: "division-fill",
        type: "fill",
        source: "divisions",
        paint: { "fill-color": matchExpr, "fill-opacity": 0.85 },
      });
      map.addLayer({
        id: "division-border",
        type: "line",
        source: "divisions",
        paint: { "line-color": "rgba(255,255,255,0.25)", "line-width": 1 },
      });

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
      map.on("mousemove", "division-fill", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const { code, name } = feature.properties as { code: string; name: string };
        map.getCanvas().style.cursor = "pointer";
        popup
          .setLngLat(e.lngLat)
          .setHTML(
            `<strong>${name}</strong><br/>${values[code] ? fmt.format(values[code]) + " people" : "no data"}`,
          )
          .addTo(map);
      });
      map.on("mouseleave", "division-fill", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
      map.on("click", "division-fill", (e) => {
        const code = (e.features?.[0]?.properties as { code?: string })?.code;
        if (code) router.push(`/divisions/${code}`);
      });
    });

    return () => map.remove();
  }, [values, router]);

  return <div ref={container} className="h-[480px] w-full rounded-lg border" />;
}
