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
          <h1 className="page-title">FIR Management</h1>
          <p className="page-subtitle">
            Execute First Information Reports via secure database transactions.
          </p>
        </div>
      </div>

      {/* Feedback toast */}
      {toast && (
        <div className={`toast toast-${toast.type} mb-6 max-w-2xl`}>
          {toast.type === "success" ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-8 items-start">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="form-section">
            <div className="form-section-title">Incident Details</div>
            <div className="form-grid">

              {/* Crime selector */}
              <div className="form-field col-span-2">
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
              <div className="form-field col-span-2">
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
              <div className="form-field col-span-2 sm:col-span-1">
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

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ minWidth: 160 }}
          >
            {submitting ? "Processing..." : "Submit FIR →"}
          </button>
        </form>

        {/* Technical & Audit Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="border border-border p-5 bg-surface">
            <div className="label mb-4 text-accent">Backend Transaction Log</div>
            <div className="font-mono text-[11px] leading-relaxed text-secondary border-l-2 border-accent pl-4">
              <span className="text-dim text-[10px] block mb-2">// Atomic PG Transaction v1.2</span>
              <div className="flex flex-col gap-1">
                <div>BEGIN;</div>
                <div className="text-primary">&nbsp;&nbsp;INSERT INTO fir_records</div>
                <div className="text-primary">&nbsp;&nbsp;(crime_id, officer_id, status)</div>
                <div className="text-primary">&nbsp;&nbsp;VALUES ($1, $2, $3);</div>
                <div className="text-dim">&nbsp;&nbsp;-- Trigger Audit Check</div>
                <div className="text-primary">&nbsp;&nbsp;UPDATE crimes</div>
                <div className="text-primary">&nbsp;&nbsp;SET status = 'Filed'</div>
                <div className="text-primary">&nbsp;&nbsp;WHERE crime_id = $1;</div>
                <div>COMMIT;</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border-dim text-[10px] text-dim italic">
              * Note: Any failure in the sequence triggers an automatic ROLLBACK to maintain data integrity.
            </div>
          </div>

          <div className="border border-border p-5 bg-surface/30">
            <div className="label mb-2">Investigation Progress</div>
            <div className="h-2 w-full bg-border-dim mt-4">
              <div className="h-full bg-accent" style={{ width: "35%" }}></div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-secondary">
              <span>Intake</span>
              <span>35% Processing</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
