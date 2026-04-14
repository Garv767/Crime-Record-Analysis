// frontend/app/offenders/page.tsx
// Offenders list — ordered by repeat-crime count, with expandable details.
"use client";

import { useEffect, useState, Fragment } from "react";
import { getOffenders, Offender } from "../../lib/api";

// Returns a threat level label + badge class based on prior convictions
function threatLevel(count: number): { label: string; cls: string } {
  if (count >= 4) return { label: "HIGH",   cls: "badge-high" };
  if (count >= 2) return { label: "MEDIUM", cls: "badge-medium" };
  if (count >= 1) return { label: "LOW",    cls: "badge-low" };
  return { label: "NONE", cls: "" };
}

export default function OffendersPage() {
  const [offenders, setOffenders] = useState<Offender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track which row is expanded (null = none)
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    getOffenders()
      .then(setOffenders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-loading">Loading offender registry...</div>;
  if (error)   return <div className="state-empty" style={{ color: "var(--accent)" }}>Error: {error}</div>;

  const repeatCount = offenders.filter((o) => o.previous_crimes_count > 0).length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Offender Registry</h1>
          <p className="page-subtitle">
            {offenders.length} registered · {repeatCount} repeat offenders
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
                      <td colSpan={7} style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border-dim)" }}>
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
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
