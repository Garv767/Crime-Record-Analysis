"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getCrimes, getOffenders, getHotspots, Crime, Offender, Hotspot } from "../lib/api";
import SQLFooter from "./components/SQLFooter";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "open": return "badge badge-open";
    case "closed": return "badge badge-closed";
    default: return "badge badge-investigating";
  }
}

function crimesByType(crimes: Crime[]) {
  const counts: Record<string, number> = {};
  crimes.forEach((c) => {
    counts[c.crime_type] = (counts[c.crime_type] ?? 0) + 1;
  });
  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

const CHART_COLORS = ["#e63946", "#e68e1b", "#4ea8de", "#43a047", "#9c27b0", "#ff7043"];

const SQL_QUERY = `SELECT 
  count(crime_id) as total_incidents,
  (SELECT count(*) FROM offenders) as known_offenders,
  (SELECT count(*) FROM hotspots WHERE risk_level >= 7) as high_risk_zones
FROM crimes;`;

export default function Dashboard() {
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [offenders, setOffenders] = useState<Offender[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  if (error)   return <div className="state-empty" style={{ color: "var(--accent)" }}>Error: {error}</div>;

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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6 items-start">

        {/* Recent Crimes Table */}
        <div className="w-full overflow-hidden">
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
                  <th className="h-hidden sm:table-cell">Location</th>
                  <th className="h-hidden md:table-cell">Date</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {crimes.slice(0, 8).map((c) => (
                  <tr key={c.crime_id}>
                    <td className="mono">#{c.crime_id}</td>
                    <td>{c.crime_type}</td>
                    <td className="secondary-text h-hidden sm:table-cell">{c.area_name}</td>
                    <td className="mono h-hidden md:table-cell">{fmtDate(c.occurrence_timestamp)}</td>
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

        {/* Sidebar content: Chart + SQL Log */}
        <div className="flex flex-col gap-6">
          {/* Crimes by Type Bar Chart */}
          <div className="w-full">
            <div className="section-header">
              <span className="section-title">Crimes by Type</span>
            </div>
            <div className="border border-border p-4 bg-surface">
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
                    itemStyle={{color: 'var(--accent-hover)'}}
                  />
                  <Bar dataKey="count" radius={0}>
                    {crimesByType(crimes).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Technical SQL Log Panel */}
          <div className="border-t border-crimson/30 pt-4">
            <div className="label mb-2 text-accent">Technical Log // Dashboard Data</div>
            <div className="bg-surface/50 p-3 border border-border font-mono text-[10px] text-secondary leading-relaxed">
              <span className="text-dim">// Aggregating live city-wide metrics</span><br/>
              SELECT <br/>
              &nbsp;&nbsp;count(crime_id) as total,<br/>
              &nbsp;&nbsp;(SELECT count(*) FROM offenders WHERE previous_crimes &gt; 0) as repeat,<br/>
              &nbsp;&nbsp;(SELECT count(*) FROM hotspots WHERE risk_level &gt;= 7) as high_risk<br/>
              FROM crimes;
            </div>
          </div>

          {/* Top Hotspot teaser */}
          {hotspots.length > 0 && (
            <div className="border border-border p-4">
              <div className="label mb-2">Highest Risk Area</div>
              <div className="text-lg font-bold">{hotspots[0].area_name}</div>
              <div className="secondary-text text-xs">
                {hotspots[0].crime_count} incident{hotspots[0].crime_count !== 1 ? "s" : ""} · Risk {hotspots[0].risk_level}/10
              </div>
              <Link href="/map" className="btn btn-ghost mt-3 w-full justify-center text-[11px]">
                View Full Map →
              </Link>
            </div>
          )}
        </div>
      </div>

      <SQLFooter query={SQL_QUERY} />
    </>
  );
}
