// frontend/app/fir/page.tsx
// FIR (First Information Report) filing form.
// Sends a POST /api/fir to the Go backend which executes a DB transaction.
"use client";

import { useState, useEffect } from "react";
import { getCrimes, createFIR, Crime, NewFIRPayload } from "../../lib/api";

// Hardcoded officer list — in a production system this would come from GET /api/officers
// Using static data here since the officers endpoint is not yet implemented
const OFFICERS = [
  { id: 1,  name: "Inspector Raghavan",     station: "T. Nagar"       },
  { id: 2,  name: "Sub-Inspector Anbu",     station: "Adyar"          },
  { id: 3,  name: "Inspector Vikram",       station: "Velachery"      },
  { id: 4,  name: "Constable Mani",         station: "Anna Nagar"     },
  { id: 5,  name: "SI Vedha",               station: "Mylapore"       },
  { id: 6,  name: "Inspector Durai",        station: "Tambaram"       },
  { id: 7,  name: "Inspector Singam",       station: "Guindy"         },
  { id: 8,  name: "SI Arul",                station: "Nungambakkam"   },
  { id: 9,  name: "Constable Selvam",       station: "Besant Nagar"   },
  { id: 10, name: "Inspector Sethupathi",   station: "Sowcarpet"      },
];

const STATUS_OPTIONS: NewFIRPayload["status"][] = ["Open", "Under Investigation", "Closed"];

export default function FIRPage() {
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [loadingCrimes, setLoadingCrimes] = useState(true);

  // Form state
  const [crimeId, setCrimeId]     = useState<number | "">("");
  const [officerId, setOfficerId] = useState<number | "">("");
  const [status, setStatus]       = useState<NewFIRPayload["status"]>("Open");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Load crimes for the dropdown
  useEffect(() => {
    getCrimes()
      .then(setCrimes)
      .catch(() => {/* non-fatal, form still renders */})
      .finally(() => setLoadingCrimes(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setToast(null);

    if (!crimeId || !officerId) {
      setToast({ type: "error", msg: "Please select both a crime and an officer." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await createFIR({ crime_id: Number(crimeId), officer_id: Number(officerId), status });
      setToast({ type: "success", msg: `FIR #${res.fir_id} filed successfully.` });
      // Reset form on success
      setCrimeId(""); setOfficerId(""); setStatus("Open");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setToast({ type: "error", msg: `Failed to file FIR: ${msg}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">File a New FIR</h1>
          <p className="page-subtitle">
            Submits a First Information Report via a database transaction — automatically links to the crime record.
          </p>
        </div>
      </div>

      {/* Feedback toast */}
      {toast && (
        <div className={`toast toast-${toast.type} mb-4`}>
          {toast.type === "success" ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        <div className="form-section">
          <div className="form-section-title">Incident Details</div>
          <div className="form-grid">

            {/* Crime selector */}
            <div className="form-field" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" htmlFor="crime-select">Incident ID</label>
              <select
                id="crime-select"
                className="form-select"
                value={crimeId}
                onChange={(e) => setCrimeId(e.target.value ? Number(e.target.value) : "")}
                required
                disabled={loadingCrimes}
              >
                <option value="">
                  {loadingCrimes ? "Loading crimes..." : "— Select an incident —"}
                </option>
                {crimes.map((c) => (
                  <option key={c.crime_id} value={c.crime_id}>
                    #{c.crime_id} · {c.crime_type} — {c.area_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Officer selector */}
            <div className="form-field" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" htmlFor="officer-select">Assigned Officer</label>
              <select
                id="officer-select"
                className="form-select"
                value={officerId}
                onChange={(e) => setOfficerId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="">— Select officer —</option>
                {OFFICERS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} · {o.station}
                  </option>
                ))}
              </select>
            </div>

            {/* Status selector */}
            <div className="form-field">
              <label className="form-label" htmlFor="status-select">Initial Status</label>
              <select
                id="status-select"
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as NewFIRPayload["status"])}
              >
                {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

          </div>
        </div>

        {/* Transaction note */}
        <div style={{
          padding: "0.75rem 1rem",
          border: "1px solid var(--border-dim)",
          marginBottom: "1.25rem",
          fontSize: "0.75rem",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-mono)",
        }}>
          // This form triggers a PostgreSQL transaction on the Go backend:<br />
          // BEGIN → INSERT fir_records → UPDATE status → COMMIT (or ROLLBACK on error)
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ minWidth: 160 }}
        >
          {submitting ? "Filing..." : "File FIR →"}
        </button>
      </form>
    </>
  );
}
