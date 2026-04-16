// frontend/app/victims/page.tsx
"use client";

import { Users, Shield, Lock, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getVictims, createVictim, Victim } from "../../lib/api";
import SQLFooter from "../components/SQLFooter";

const SQL_QUERY = `SELECT 
  v.victim_id, 
  v.name, 
  v.age, 
  v.contact_no, 
  v.address 
FROM public.victims v 
ORDER BY v.victim_id DESC;`;

export default function VictimRegistry() {
  const [searchTerm, setSearchTerm] = useState("");
  const [victims, setVictims] = useState<Victim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [newVic, setNewVic] = useState({ name: "", age: 0, contact_no: "", address: "" });
  const [saving, setSaving] = useState(false);

  const fetchVictims = () => {
    getVictims()
      .then(setVictims)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVictims();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createVictim(newVic);
      setShowAdd(false);
      setNewVic({ name: "", age: 0, contact_no: "", address: "" });
      fetchVictims();
    } catch(err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="state-loading">Accessing protected records...</div>;
  if (error)   return <div className="state-empty text-accent">Error: {error}</div>;

  const filteredVictims = victims.filter(v => 
    searchTerm === "" ||
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.victim_id.toString().includes(searchTerm) ||
    v.contact_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Victim Registry</h1>
          <p className="page-subtitle">Secure management of survivor data and incident testimony.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Register Victim</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-8 items-start">
        <div className="w-full">
          <div className="section-header">
            <span className="section-title">Protected Records</span>
            <div className="flex items-center gap-2 bg-surface border border-border px-2 py-1">
              <Search size={14} className="text-secondary" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none text-[12px] outline-none text-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>VIC-ID</th>
                  <th>Name</th>
                  <th className="h-hidden sm:table-cell">Contact</th>
                  <th>Age</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredVictims.map((v) => (
                  <tr key={v.victim_id}>
                    <td className="mono accent">VIC-{v.victim_id}</td>
                    <td>{v.name}</td>
                    <td className="secondary-text h-hidden sm:table-cell">{v.contact_no}</td>
                    <td className="mono">{v.age}</td>
                    <td className="secondary-text">{v.address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Information Summary */}
        <div className="flex flex-col gap-6">
          <div className="border border-border p-5 bg-surface">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-secondary" />
              <div className="label text-secondary">Summary View</div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-[12px]">
                <span className="text-secondary">Total Records</span>
                <span className="font-mono font-bold">{victims.length}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-secondary">Status</span>
                <span className="text-green-500 font-mono">LIVE // DB-PROD</span>
              </div>
            </div>
          </div>

          <div className="border border-border p-5 bg-surface/30">
            <div className="label mb-4 text-secondary">Registry Context</div>
            <div className="text-[11px] text-dim leading-relaxed">
              This registry maintains the master list of victims associated with all filed FIRs. 
              The data is synchronized in real-time with the central crime record database.
            </div>
          </div>
        </div>
      </div>

      <SQLFooter query={SQL_QUERY} />

      {showAdd && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <form className="bg-surface border border-border w-full max-w-lg p-6" onSubmit={handleCreate}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
              <h2 className="text-lg font-bold uppercase tracking-tight">Register Victim</h2>
              <button type="button" onClick={() => setShowAdd(false)} className="text-secondary hover:text-primary"><X size={18}/></button>
            </div>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="grid grid-cols-[1fr,80px] gap-4">
                <div className="form-field">
                  <label className="form-label">Full Name</label>
                  <input required className="form-input" value={newVic.name} onChange={e => setNewVic({...newVic, name: e.target.value})} placeholder="Full legal name" />
                </div>
                <div className="form-field">
                  <label className="form-label">Age</label>
                  <input required type="number" className="form-input" value={newVic.age || ''} onChange={e => setNewVic({...newVic, age: parseInt(e.target.value) || 0})} placeholder="Age" />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Contact Number</label>
                <input required className="form-input" value={newVic.contact_no} onChange={e => setNewVic({...newVic, contact_no: e.target.value})} placeholder="Primary contact" />
              </div>
              <div className="form-field">
                <label className="form-label">Address</label>
                <textarea className="form-input min-h-[80px] py-2" rows={3} value={newVic.address} onChange={e => setNewVic({...newVic, address: e.target.value})} placeholder="Current residential address..."></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Registering..." : "Register Victim →"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
