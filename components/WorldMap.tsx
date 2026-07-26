"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
// Bundled world geography (no runtime CDN dependency).
import topology from "world-atlas/countries-110m.json";

export type MapMarker = {
  lat: number;
  lon: number;
  count: number;
  label?: string;
};

// react-simple-maps' geography prop is loosely typed; the topojson object is valid.
const geography = topology as unknown as Record<string, unknown>;

export function WorldMap({ markers }: { markers: MapMarker[] }) {
  const max = markers.reduce((m, x) => Math.max(m, x.count), 0) || 1;
  const radius = (c: number) => 3.5 + (c / max) * 8.5; // ~3.5–12px

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-line bg-white">
      <ComposableMap
        projectionConfig={{ scale: 155 }}
        width={900}
        height={420}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={geography}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#f1f1f3"
                stroke="#e2e2e8"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "#e9e4ff" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {markers.map((m, i) => (
          <Marker key={i} coordinates={[m.lon, m.lat]}>
            <circle
              r={radius(m.count)}
              fill="#111111"
              fillOpacity={0.7}
              stroke="#ffffff"
              strokeWidth={1.2}
            />
            {m.count > 1 && (
              <title>
                {m.label ? `${m.label}: ` : ""}
                {m.count}
              </title>
            )}
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}
