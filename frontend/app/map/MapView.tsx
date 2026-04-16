// frontend/app/map/MapView.tsx
// The actual Leaflet map component — separated so that the parent page can
// use dynamic() to disable SSR (Leaflet needs the DOM).
"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import MarkerClusterGroup from "react-leaflet-cluster";
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

// Define a custom cluster icon styled for the dark theme
const createClusterCustomIcon = function (cluster: any) {
  const childCount = cluster.getChildCount();
  return L.divIcon({
    html: `<span>${childCount}</span>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(40, 40, true),
  });
};

export default function MapView({ hotspots }: MapViewProps) {
  // Chennai city centre coordinates
  const CHENNAI_CENTRE: LatLngExpression = [13.0827, 80.2707];

  return (
    <MapContainer
      center={CHENNAI_CENTRE}
      zoom={12}
      style={{ height: "100%", width: "100%", background: "#0d0d0d" }}
      minZoom={10} // Limit zooming out too far to keep context
    >
      {/* Dark tile layer from CartoDB — complements the dark UI */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterCustomIcon}
        maxClusterRadius={60} // Cluster very close crime spots
      >
        {/* One marker per hotspot — radius scaled by crime count with strict limits */}
        {hotspots.map((h) => {
          const position: LatLngExpression = [h.latitude, h.longitude];
          // Set a limit to how small it can get: Math.max(12, Math.min(40, ...))
          const calculatedRadius = Math.max(12, Math.min(40, 8 + h.crime_count * 2));
          return (
            <CircleMarker
              key={h.location_id}
              center={position}
              radius={calculatedRadius}
              pathOptions={{
                color: riskColour(h.risk_level),
                fillColor: riskColour(h.risk_level),
                fillOpacity: 0.7,
                weight: 1.5,
              }}
            >
              {/* custom-popup applied globally in globals.css */}
              <Popup className="custom-popup">
                <div style={{ fontFamily: "Space Grotesk, sans-serif", minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    {h.area_name}
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{h.city}</div>
                  <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase" }}>Crimes</div>
                      <div style={{ fontWeight: 700, color: "#e63946" }}>{h.crime_count}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase" }}>Risk</div>
                      <div style={{ fontWeight: 700 }}>{h.risk_level}/10</div>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
