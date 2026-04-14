// frontend/app/crimes/page.tsx
// Crimes list page — full sortable table with type filter.
"use client";

import { useEffect, useState, useMemo } from "react";
import { getCrimes, getCrimeTypes, Crime } from "../../lib/api";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

// Risk badge helper
function RiskBadge({ level }: { level: number }) {
  const cls = level >= 7 ? "badge-high" : level >= 4 ? "badge-medium" : "badge-low";
  return <span className={`badge ${cls}`}>{level}/10</span>;
}

type SortKey = "crime_id" | "crime_type" | "area_name" | "occurrence_timestamp" | "risk_level";

export default function CrimesPage() {
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & sort state
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("occurrence_timestamp");
  const [sortAsc, setSortAsc] = useState(false);

  const [crimeTypes, setCrimeTypes] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([getCrimes(), getCrimeTypes()])
      .then(([crimesData, typesData]) => {
        setCrimes(crimesData);
        setCrimeTypes(["All", ...typesData]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Apply client-side filter and sort
  const filtered = useMemo(() => {
    let rows = typeFilter === "All" ? crimes : crimes.filter((c) => c.crime_type === typeFilter);
    rows = [...rows].sort((a, b) => {
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return rows;
  }, [crimes, typeFilter, sortKey, sortAsc]);

  // Toggle sort column — click same column reverses direction
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  const sortIcon = (key: SortKey) => sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";

  if (loading) return <div className="state-loading">Loading incidents...</div>;
  if (error)   return <div className="state-empty" style={{ color: "var(--accent)" }}>Error: {error}</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Incidents</h1>
          <p className="page-subtitle">{filtered.length} records — sorted by {sortKey}</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="filter-bar mb-4">
        <label className="label" style={{ alignSelf: "center" }}>Filter by type</label>
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {crimeTypes.map((t) => <option key={t}>{t}</option>)}
        </select>
        {typeFilter !== "All" && (
          <button className="btn btn-ghost" onClick={() => setTypeFilter("All")}>
            Clear
          </button>
        )}
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("crime_id")}>ID{sortIcon("crime_id")}</th>
              <th onClick={() => toggleSort("crime_type")}>Type{sortIcon("crime_type")}</th>
              <th onClick={() => toggleSort("area_name")}>Location{sortIcon("area_name")}</th>
              <th onClick={() => toggleSort("occurrence_timestamp")}>Timestamp{sortIcon("occurrence_timestamp")}</th>
              <th onClick={() => toggleSort("risk_level")}>Risk{sortIcon("risk_level")}</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-dim)", padding: "2rem" }}>
                  No incidents match this filter.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.crime_id}>
                  <td className="mono">#{c.crime_id}</td>
                  <td style={{ fontWeight: 600 }}>{c.crime_type}</td>
                  <td className="secondary-text">{c.area_name}</td>
                  <td className="mono">{fmtDate(c.occurrence_timestamp)}</td>
                  <td><RiskBadge level={c.risk_level} /></td>
                  <td className="secondary-text" style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
