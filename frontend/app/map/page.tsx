// frontend/app/map/page.tsx
// Crime hotspot map — Leaflet map centred on Chennai.
// Markers are colour-coded by risk level (red/amber/green).
// react-leaflet requires "use client" because it references the DOM.
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getHotspots, Hotspot } from "../../lib/api";

// Dynamically import the map component with SSR disabled.
// Leaflet uses window/document, which don't exist during Next.js server rendering.
const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: () => (
  <div className="state-loading" style={{ height: 500 }}>Initialising map...</div>
)});

export default function MapPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHotspots()
      .then(setHotspots)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Crime Hotspot Map</h1>
          <p className="page-subtitle">Chennai Metropolitan Area — {hotspots.length} active zones</p>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span className="badge badge-high">Risk 7–10</span>
          <span className="badge badge-medium">Risk 4–6</span>
          <span className="badge badge-low">Risk 1–3</span>
        </div>
      </div>

      {error && (
        <div className="toast toast-error mb-4">Error: {error}. Is the Go API running?</div>
      )}

      {/* Map fills the remaining viewport height */}
      <div style={{ border: "1px solid var(--border)", height: "calc(100vh - 180px)" }}>
        {!loading && <MapView hotspots={hotspots} />}
      </div>

      {/* Hotspot data table below the map */}
      <div style={{ marginTop: "1.5rem" }}>
        <div className="section-header">
          <span className="section-title">Zone Details</span>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>Incidents</th>
                <th>Risk Level</th>
                <th>Coordinates</th>
              </tr>
            </thead>
            <tbody>
              {hotspots.map((h) => (
                <tr key={h.location_id}>
                  <td style={{ fontWeight: 600 }}>{h.area_name}</td>
                  <td className="mono accent-text">{h.crime_count}</td>
                  <td>
                    <span className={`badge ${h.risk_level >= 7 ? "badge-high" : h.risk_level >= 4 ? "badge-medium" : "badge-low"}`}>
                      {h.risk_level}/10
                    </span>
                  </td>
                  <td className="mono secondary-text">
                    {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
