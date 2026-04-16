// frontend/app/crimes/page.tsx
// Incidents list page — full sortable table with type filter.
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { FileText, Plus, X } from "lucide-react";
import { getCrimes, getCrimeTypes, getLocations, createCrime, Crime, Location as CrimeLocation } from "../../lib/api";
import SQLFooter from "../components/SQLFooter";

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

const SQL_QUERY = `SELECT 
  c.crime_id, 
  c.crime_type, 
  c.occurrence_timestamp, 
  c.description, 
  l.area_name, 
  l.risk_level 
FROM public.crimes c 
LEFT JOIN public.locations l ON c.location_id = l.location_id 
ORDER BY c.occurrence_timestamp DESC;`;

export default function CrimesPage() {
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & sort state
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("occurrence_timestamp");
  const [sortAsc, setSortAsc] = useState(false);

  const [crimeTypes, setCrimeTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<CrimeLocation[]>([]);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState("");
  const [newLocId, setNewLocId] = useState<number | "">("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getCrimes(), getCrimeTypes(), getLocations()])
      .then(([crimesData, typesData, locData]) => {
        setCrimes(crimesData);
        setCrimeTypes(["All", ...typesData]);
        setLocations(locData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAddIncident(e: React.FormEvent) {
    e.preventDefault();
    if (!newType || !newLocId) return;

    setSubmitting(true);
    try {
      await createCrime({
        crime_type: newType,
        location_id: Number(newLocId),
        description: newDesc
      });
      // Refresh list
      const updated = await getCrimes();
      setCrimes(updated);
      setShowAddModal(false);
      setNewType(""); setNewLocId(""); setNewDesc("");
    } catch (err: any) {
      alert(err.message || "Failed to report incident");
    } finally {
      setSubmitting(false);
    }
  }

  // Apply client-side filter and sort
  const filtered = useMemo(() => {
    let rows = typeFilter === "All" ? crimes : crimes.filter((c) => c.crime_type === typeFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      rows = rows.filter(c => 
        c.crime_id.toString().includes(term) ||
        c.crime_type.toLowerCase().includes(term) ||
        (c.area_name && c.area_name.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term))
      );
    }
    rows = [...rows].sort((a, b) => {
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return rows;
  }, [crimes, typeFilter, searchTerm, sortKey, sortAsc]);

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
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          Report Incident
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="filter-bar mb-4">
        <input 
          type="text" 
          placeholder="Search records..." 
          className="form-input flex-1 max-w-[300px]"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {crimeTypes.map((t) => <option key={t}>{t}</option>)}
        </select>
        {(typeFilter !== "All" || searchTerm !== "") && (
          <button className="btn btn-ghost" onClick={() => { setTypeFilter("All"); setSearchTerm(""); }}>
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
              <th style={{ textAlign: "right" }}>Actions</th>
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
                  <td style={{ textAlign: "right" }}>
                    <Link 
                      href={`/fir?crimeId=${c.crime_id}`}
                      className="btn btn-ghost" 
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                      title="File FIR for this incident"
                    >
                      <FileText size={12} className="text-accent" />
                      File FIR
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SQLFooter query={SQL_QUERY} />

      {/* Add Incident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-surface border border-border w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-bold uppercase tracking-tighter">Report New Incident</h2>
              <button onClick={() => setShowAddModal(false)} className="text-dim hover:text-primary">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddIncident} className="p-6 space-y-6">
              <div className="form-field">
                <label className="form-label">Crime Type</label>
                <select 
                  className="form-select" 
                  value={newType} 
                  onChange={e => setNewType(e.target.value)}
                  required
                >
                  <option value="">— Select Type —</option>
                  {crimeTypes.filter(t => t !== "All").map(t => <option key={t}>{t}</option>)}
                  <option value="Other">Other / Investigation</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Location (Area Name)</label>
                <select 
                  className="form-select" 
                  value={newLocId} 
                  onChange={e => setNewLocId(e.target.value)}
                  required
                >
                  <option value="">— Select Location —</option>
                  {locations.map(l => (
                    <option key={l.location_id} value={l.location_id}>
                      {l.area_name} ({l.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Preliminary Description</label>
                <textarea 
                  className="form-input min-h-[100px] py-2" 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Initial details, suspects, or evidence noted..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Registering..." : "Record Incident →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
