// frontend/app/page.tsx
// Dashboard — the landing page of the CRPA system.
// Shows live stat counts, a recent crimes table, and a crimes-by-type bar chart.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getCrimes, getOffenders, getHotspots, Crime, Offender, Hotspot } from "../lib/api";

// Formats an ISO timestamp to a readable short form
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Returns the correct CSS class for a crime status badge
function statusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "open": return "badge badge-open";
    case "closed": return "badge badge-closed";
    default: return "badge badge-investigating";
  }
}

// Aggregates crimes into a count-per-type array for the bar chart
function crimesByType(crimes: Crime[]) {
  const counts: Record<string, number> = {};
  crimes.forEach((c) => {
    counts[c.crime_type] = (counts[c.crime_type] ?? 0) + 1;
  });
  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

// Bar chart accent colours — one per crime type, cycling through a palette
const CHART_COLORS = ["#e63946", "#e68e1b", "#4ea8de", "#43a047", "#9c27b0", "#ff7043"];

export default function Dashboard() {
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [offenders, setOffenders] = useState<Offender[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all three datasets in parallel
    Promise.all([getCrimes(), getOffenders(), getHotspots()])
      .then(([c, o, h]) => {
        setCrimes(c);
        setOffenders(o);
        setHotspots(h);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Derived stats for the stat bar
  const highRiskZones = hotspots.filter((h) => h.risk_level >= 7).length;
  const repeatOffenders = offenders.filter((o) => o.previous_crimes_count > 0).length;

  if (loading) return <div className="state-loading">Connecting to CRPA API...</div>;
  if (error)   return <div className="state-empty" style={{ color: "var(--accent)" }}>Error: {error}. Is the Go server running on :8080?</div>;

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Command Dashboard</h1>
          <p className="page-subtitle">Chennai Metropolitan Area — Live Intelligence Feed</p>
        </div>
        <Link href="/fir" className="btn btn-primary">
          + File New FIR
        </Link>
      </div>

      {/* Stat Bar — four key numbers at a glance */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Total Incidents</div>
          <div className="stat-value accent">{crimes.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Known Offenders</div>
          <div className="stat-value">{offenders.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Repeat Offenders</div>
          <div className="stat-value amber">{repeatOffenders}</div>
        </div>
        <div className="stat-card">
          <div className="label">High-Risk Zones</div>
          <div className="stat-value" style={{ color: "var(--risk-high)" }}>{highRiskZones}</div>
        </div>
      </div>

      {/* Two-column layout: recent crimes + chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", alignItems: "start" }}>

        {/* Recent Crimes Table */}
        <div>
          <div className="section-header">
            <span className="section-title">Recent Incidents</span>
            <Link href="/crimes" className="btn btn-ghost" style={{ fontSize: "0.7rem" }}>
              View All →
            </Link>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {crimes.slice(0, 8).map((c) => (
                  <tr key={c.crime_id}>
                    <td className="mono">#{c.crime_id}</td>
                    <td>{c.crime_type}</td>
                    <td className="secondary-text">{c.area_name}</td>
                    <td className="mono">{fmtDate(c.occurrence_timestamp)}</td>
                    <td>
                      <span className={`badge ${c.risk_level >= 7 ? "badge-high" : c.risk_level >= 4 ? "badge-medium" : "badge-low"}`}>
                        {c.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Crimes by Type Bar Chart */}
        <div>
          <div className="section-header">
            <span className="section-title">Crimes by Type</span>
          </div>
          <div style={{ border: "1px solid var(--border)", padding: "1rem" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={crimesByType(crimes)}
                layout="vertical"
                margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="type"
                  type="category"
                  width={80}
                  tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontFamily: "Space Grotesk",
                    borderRadius: 0,
                    boxShadow: "none",
                  }}
                  cursor={{ fill: "var(--bg-hover)" }}
                />
                <Bar dataKey="count" radius={0}>
                  {crimesByType(crimes).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Hotspot teaser */}
          {hotspots.length > 0 && (
            <div style={{ marginTop: "1rem", border: "1px solid var(--border)", padding: "0.75rem 1rem" }}>
              <div className="label mb-2">Highest Crime Area</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{hotspots[0].area_name}</div>
              <div className="secondary-text" style={{ fontSize: "0.75rem" }}>
                {hotspots[0].crime_count} incident{hotspots[0].crime_count !== 1 ? "s" : ""} · Risk {hotspots[0].risk_level}/10
              </div>
              <Link href="/map" className="btn btn-ghost" style={{ marginTop: "0.75rem", fontSize: "0.7rem" }}>
                View Full Map →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
