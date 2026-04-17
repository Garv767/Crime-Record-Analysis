"use client";

import { useEffect, useState, Fragment } from "react";
import { getOffenders, getCrimes, linkOffenderToCrime, Offender, Crime } from "../../lib/api";
import SQLFooter from "../components/SQLFooter";

// Returns a threat level label + badge class based on prior convictions
function threatLevel(count: number): { label: string; cls: string } {
  if (count >= 4) return { label: "HIGH",   cls: "badge-high" };
  if (count >= 2) return { label: "MEDIUM", cls: "badge-medium" };
  if (count >= 1) return { label: "LOW",    cls: "badge-low" };
  return { label: "NONE", cls: "" };
}

const SQL_QUERY = `SELECT 
  o.offender_id, 
  o.name, 
  o.age, 
  o.previous_crimes_count as prior_convictions, 
  count(ol.crime_id) as active_links 
FROM public.offenders o 
LEFT JOIN public.offender_links ol ON o.offender_id = ol.offender_id 
GROUP BY o.offender_id 
ORDER BY prior_convictions DESC;`;

export default function OffendersPage() {
  const [offenders, setOffenders] = useState<Offender[]>([]);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Link state
  const [expanded, setExpanded] = useState<number | null>(null);
  const [selectedCrimeId, setSelectedCrimeId] = useState<number | "">("");
  const [selectedRole, setSelectedRole] = useState("Primary Suspect");
  const [linking, setLinking] = useState(false);

  const fetchInit = async () => {
    try {
      setLoading(true);
      const [ofs, crs] = await Promise.all([getOffenders(), getCrimes()]);
      setOffenders(ofs);
      setCrimes(crs);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInit();
  }, []);

  const handleLink = async (offenderId: number) => {
    if (!selectedCrimeId) return;
    setLinking(true);
    try {
      await linkOffenderToCrime({
        crime_id: Number(selectedCrimeId),
        offender_id: offenderId,
        role: selectedRole
      });
      alert("Successfully linked offender to incident.");
      fetchInit(); // Refresh list to get updated count
      setExpanded(null); // Close panel
    } catch (e: any) {
      alert("Error linking: " + e.message);
    } finally {
      setLinking(false);
    }
  };

  if (loading) return <div className="state-loading">Loading offender registry...</div>;
  if (error)   return <div className="state-empty" style={{ color: "var(--accent)" }}>Error: {error}</div>;

  const repeatCount = offenders.filter((o) => o.previous_crimes_count > 0).length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Offender Registry</h1>
          <p className="page-subtitle">
            {offenders.length} registered · {repeatCount} recidivists
          </p>
        </div>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Prior Convictions</th>
              <th>Linked Crimes</th>
              <th>Threat Level</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {offenders.map((o) => {
              const threat = threatLevel(o.previous_crimes_count);
              const isOpen = expanded === o.offender_id;
              return (
                <Fragment key={o.offender_id}>
                  <tr style={isOpen ? { background: "var(--bg-row)" } : {}}>
                    <td className="mono">#{o.offender_id}</td>
                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td className="mono">{o.age}</td>
                    <td>
                      <span className="mono" style={{
                        color: o.previous_crimes_count > 0 ? "var(--accent)" : "var(--text-dim)"
                      }}>
                        {o.previous_crimes_count}
                      </span>
                    </td>
                    <td className="mono">{o.linked_crimes_count}</td>
                    <td>
                      {threat.label !== "NONE" ? (
                        <span className={`badge ${threat.cls}`}>{threat.label}</span>
                      ) : (
                        <span className="dim-text" style={{ fontSize: "0.75rem" }}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
                        onClick={() => setExpanded(isOpen ? null : o.offender_id)}
                      >
                        {isOpen ? "Hide" : "Details"}
                      </button>
                    </td>
                  </tr>

                  {/* Expandable detail row */}
                  {isOpen && (
                    <tr key={`${o.offender_id}-detail`} style={{ background: "var(--bg-row)" }}>
                      <td colSpan={7} style={{ padding: "1.5rem", borderTop: "1px solid var(--border-dim)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
                          <div>
                            <div className="label mb-1">Full Name</div>
                            <div style={{ fontWeight: 600 }}>{o.name}</div>
                          </div>
                          <div>
                            <div className="label mb-1">Last Known Address</div>
                            <div className="secondary-text">{o.address || "Unknown"}</div>
                          </div>
                          <div>
                            <div className="label mb-1">Offender ID</div>
                            <div className="mono accent-text">#{o.offender_id}</div>
                          </div>
                        </div>

                        {/* Link to Incident Form */}
                        <div className="mt-6 pt-6 border-t border-border-dim">
                          <div className="label mb-3 text-accent flex items-center gap-2">
                            Link to Incident
                          </div>
                          <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[200px]">
                              <label className="form-label" style={{ fontSize: '0.65rem' }}>Select Incident</label>
                              <select 
                                className="form-select w-full"
                                value={selectedCrimeId}
                                onChange={e => setSelectedCrimeId(e.target.value ? Number(e.target.value) : "")}
                              >
                                <option value="">— Select Incident —</option>
                                {crimes.map(c => (
                                  <option key={c.crime_id} value={c.crime_id}>
                                    #{c.crime_id} · {c.crime_type} ({c.area_name})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="w-[180px]">
                              <label className="form-label" style={{ fontSize: '0.65rem' }}>Role</label>
                              <select 
                                className="form-select w-full"
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value)}
                              >
                                <option value="Primary Suspect">Primary Suspect</option>
                                <option value="Accomplice">Accomplice</option>
                                <option value="Witness">Witness</option>
                                <option value="Mastermind">Mastermind</option>
                              </select>
                            </div>
                            <button 
                              className="btn btn-primary"
                              disabled={linking || !selectedCrimeId}
                              onClick={() => handleLink(o.offender_id)}
                              style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", height: "36px" }}
                            >
                              {linking ? "Linking..." : "Establish Link"}
                            </button>
                          </div>
                          <p className="text-[10px] text-dim mt-3 italic">
                              * Linkage actions are recorded in the central audit registry.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <SQLFooter query={SQL_QUERY} />
    </>
  );
}
