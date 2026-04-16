// frontend/app/fir/page.tsx
// FIR (First Information Report) filing form.
// Sends a POST /api/fir to the Go backend which executes a DB transaction.
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ChevronDown, ChevronUp, FileText, User, Shield, Calendar, Activity } from "lucide-react";
import { 
  getCrimes, getOfficers, createFIR, getFIRs, updateFIRStatus,
  Crime, PoliceOfficer, NewFIRPayload, FIRDetailed 
} from "../../lib/api";
import SQLFooter from "../components/SQLFooter";

const STATUS_OPTIONS: NonNullable<NewFIRPayload["status"]>[] = ["Open", "Under Investigation", "Closed"];

const SQL_QUERY = `-- FIR Tracking & Status Updates
-- Fetching joined FIR details
SELECT 
  f.fir_id, f.fir_date, f.status, 
  c.crime_type, l.area_name,
  o.name as officer_name
FROM public.fir_records f
JOIN public.crimes c ON f.crime_id = c.crime_id
JOIN public.locations l ON c.location_id = l.location_id
JOIN public.police_officers o ON f.officer_id = o.officer_id;

-- Updating FIR status
UPDATE public.fir_records 
SET status = $1 
WHERE fir_id = $2;`;

export const dynamic = "force-dynamic";

export default function FIRPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-24">
        <Loader2 className="animate-spin text-accent" size={32} />
        <span className="ml-3 text-dim mono">Hydrating Intelligence System...</span>
      </div>
    }>
      <FIRContent />
    </Suspense>
  );
}

function FIRContent() {
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [officers, setOfficers] = useState<PoliceOfficer[]>([]);
  const [firs, setFirs] = useState<FIRDetailed[]>([]);
  const [loadingCrimes, setLoadingCrimes] = useState(true);
  const [loadingFirs, setLoadingFirs] = useState(true);
  const searchParams = useSearchParams();
  const queryCrimeId = searchParams.get("crimeId");

  // Form state
  const [crimeId, setCrimeId]     = useState<number | "">("");
  const [officerId, setOfficerId] = useState<number | "">("");
  const [status, setStatus]       = useState<NonNullable<NewFIRPayload["status"]>>("Open");
  const [victimName, setVictimName] = useState("");
  const [victimAge, setVictimAge] = useState<number | "">("");
  const [victimContact, setVictimContact] = useState("");
  const [victimAddress, setVictimAddress] = useState("");

  // UI state
  const [expandedFirId, setExpandedFirId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    // Initial data fetch
    getCrimes()
      .then(data => {
        setCrimes(data);
        if (queryCrimeId) {
          const found = data.find(c => c.crime_id === Number(queryCrimeId));
          if (found) setCrimeId(found.crime_id);
        }
      })
      .finally(() => setLoadingCrimes(false));
      
    getOfficers().then(setOfficers).catch(console.error);
    fetchFirs();
  }, [queryCrimeId]);

  const fetchFirs = async () => {
    setLoadingFirs(true);
    try {
      const data = await getFIRs();
      setFirs(data);
    } catch (err) {
      console.error("Failed to fetch FIRs", err);
    } finally {
      setLoadingFirs(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setToast(null);

    if (!crimeId || !officerId) {
      setToast({ type: "error", msg: "Please select both a crime and an officer." });
      return;
    }

    setSubmitting(true);
    try {
      const payload: NewFIRPayload = {
        crime_id: Number(crimeId),
        officer_id: Number(officerId),
        status,
        ...(victimName ? { 
           victim_name: victimName, 
           victim_age: typeof victimAge === 'number' ? victimAge : 0, 
           victim_contact: victimContact, 
           victim_address: victimAddress 
        } : {})
      };
      const res = await createFIR(payload);
      setToast({ type: "success", msg: `FIR #${res.fir_id} filed successfully.` });
      
      // Reset form
      setCrimeId(""); setOfficerId(""); setStatus("Open");
      setVictimName(""); setVictimAge(""); setVictimContact(""); setVictimAddress("");
      
      // Refresh list
      fetchFirs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setToast({ type: "error", msg: `Failed to file FIR: ${msg}` });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusUpdate(id: number, newStatus: string) {
    try {
      await updateFIRStatus(id, newStatus);
      setToast({ type: "success", msg: `FIR #${id} status updated to ${newStatus}.` });
      fetchFirs();
    } catch (err) {
      setToast({ type: "error", msg: "Failed to update FIR status." });
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
        <div className="flex flex-col gap-8">
          {/* Section 1: Filing Form */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="form-section">
              <div className="form-section-title flex items-center gap-2">
                <FileText size={16} /> Incident Details
              </div>
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
                    {officers.map((o) => (
                      <option key={o.officer_id} value={o.officer_id}>
                        {o.name} · {o.station} (Badge: {o.badge_number})
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
            
            <div className="form-section mt-8">
              <div className="form-section-title flex items-center gap-2">
                <User size={16} /> Victim Details (Optional)
              </div>
              <p className="text-dim text-sm mb-4">If unknown or missing, these will be auto-created and linked.</p>
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Victim Name</label>
                  <input className="form-input" value={victimName} onChange={e => setVictimName(e.target.value)} placeholder="e.g. R. Subramanian" />
                </div>
                <div className="form-field">
                  <label className="form-label">Age</label>
                  <input type="number" className="form-input" value={victimAge || ''} onChange={e => setVictimAge(parseInt(e.target.value) || "")} placeholder="Age" />
                </div>
                <div className="form-field">
                  <label className="form-label">Contact Number</label>
                  <input className="form-input" value={victimContact} onChange={e => setVictimContact(e.target.value)} placeholder="e.g. +91 9876543210" />
                </div>
                <div className="form-field">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={victimAddress} onChange={e => setVictimAddress(e.target.value)} placeholder="Current residence" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary mt-6"
              disabled={submitting}
              style={{ minWidth: 160 }}
            >
              {submitting ? "Processing..." : "Submit FIR →"}
            </button>
          </form>

          {/* Section 2: FIR Tracking Accordion */}
          <div className="w-full">
            <div className="section-header">
              <span className="section-title">Active FIR Tracking</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {loadingFirs ? (
                <div className="state-loading">Synchronizing records...</div>
              ) : firs.length === 0 ? (
                <div className="state-empty">No FIR records found in the database.</div>
              ) : (
                firs.map((fir) => {
                  const isExpanded = expandedFirId === fir.fir_id;
                  return (
                    <div key={fir.fir_id} className="border border-border bg-surface overflow-hidden transition-all">
                      <div 
                        className={`p-4 flex items-center justify-between cursor-pointer hover:bg-bg-hover ${isExpanded ? 'bg-bg-hover' : ''}`}
                        onClick={() => setExpandedFirId(isExpanded ? null : fir.fir_id)}
                      >
                        <div className="flex items-center gap-6">
                          <div className="mono text-accent font-bold">#{fir.fir_id}</div>
                          <div className="hidden sm:block">
                            <div className="text-[10px] uppercase text-dim mono mb-0.5">Incident Type</div>
                            <div className="text-sm font-bold">{fir.crime_type}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase text-dim mono mb-0.5">Area</div>
                            <div className="text-sm font-bold">{fir.area_name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`badge ${
                            fir.status === 'Open' ? 'badge-low' : 
                            fir.status === 'Under Investigation' ? 'badge-medium' : 
                            'badge-high'
                          }`}>
                            {fir.status}
                          </span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-6 border-t border-border-dim grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200">
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <Calendar className="text-accent mt-1" size={14} />
                              <div>
                                <div className="label text-[10px]">Filing Date</div>
                                <div className="text-sm mono">{new Date(fir.fir_date).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Shield className="text-accent mt-1" size={14} />
                              <div>
                                <div className="label text-[10px]">Investigating Officer</div>
                                <div className="text-sm font-bold">{fir.officer_name}</div>
                                <div className="text-[10px] mono text-dim">Badge #{fir.badge_number}</div>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Activity className="text-accent mt-1" size={14} />
                              <div>
                                <div className="label text-[10px]">Incident Brief</div>
                                <div className="text-sm italic leading-relaxed text-secondary">
                                  "{fir.crime_desc || "No description provided."}"
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-bg-base/50 p-4 border border-border-dim rounded">
                            <div className="label mb-3 text-accent">Update Investigation Status</div>
                            <div className="flex flex-col gap-2">
                              {STATUS_OPTIONS.map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() => handleStatusUpdate(fir.fir_id, opt)}
                                  className={`text-left p-2 text-xs font-mono border transition-all ${
                                    fir.status === opt 
                                      ? 'bg-accent border-accent text-white' 
                                      : 'bg-surface border-border text-primary hover:border-accent'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                            <p className="text-[10px] text-dim mt-3 italic">
                              * All status changes are logged in the central audit registry.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="flex flex-col gap-6">
          <div className="border border-border p-5 bg-surface">
            <div className="label mb-4 text-accent">System Integrity</div>
            <div className="text-[11px] text-secondary leading-relaxed mb-4">
              FIR filings are strictly transactional. Once submitted, they are linked to incident IDs and assigned officers via foreign key constraints.
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-secondary">Auth Level</span>
                <span className="font-mono text-green-500">SUPERIOR_OFFICER</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-secondary">DB Protocol</span>
                <span className="font-mono">POSTGRES_TX</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SQLFooter query={SQL_QUERY} />
    </>
  );
}
