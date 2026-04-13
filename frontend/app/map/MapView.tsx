// frontend/app/map/MapView.tsx
// The actual Leaflet map component — separated so that the parent page can
// use dynamic() to disable SSR (Leaflet needs the DOM).
"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Hotspot } from "../../lib/api";

interface MapViewProps {
  hotspots: Hotspot[];
}

// Returns a hex colour based on risk level — matches our CSS design tokens
function riskColour(risk: number): string {
  if (risk >= 7) return "#e63946"; // crimson — high risk
  if (risk >= 4) return "#e68e1b"; // amber   — medium risk
  return "#43a047";                // green   — low risk
}

export default function MapView({ hotspots }: MapViewProps) {
  // Chennai city centre coordinates
  const CHENNAI_CENTRE: LatLngExpression = [13.0827, 80.2707];

  return (
    <MapContainer
      center={CHENNAI_CENTRE}
      zoom={12}
      style={{ height: "100%", width: "100%", background: "#0d0d0d" }}
    >
      {/* Dark tile layer from CartoDB — complements the dark UI */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      {/* One marker per hotspot — radius scaled by crime count */}
      {hotspots.map((h) => {
        const position: LatLngExpression = [h.latitude, h.longitude];
        return (
          <CircleMarker
            key={h.location_id}
            center={position}
            radius={8 + h.crime_count * 2}
            pathOptions={{
              color: riskColour(h.risk_level),
              fillColor: riskColour(h.risk_level),
              fillOpacity: 0.7,
              weight: 1.5,
            }}
          >
            {/* Popup shows area stats on click */}
            <Popup>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                  {h.area_name}
                </div>
                <div style={{ fontSize: 11, color: "#888" }}>{h.city}</div>
                <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>Crimes</div>
                    <div style={{ fontWeight: 700, color: "#e63946" }}>{h.crime_count}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>Risk</div>
                    <div style={{ fontWeight: 700 }}>{h.risk_level}/10</div>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
