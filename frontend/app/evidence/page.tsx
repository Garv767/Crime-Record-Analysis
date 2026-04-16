// frontend/app/evidence/page.tsx
"use client";

import { Box, Calendar, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getEvidence, createEvidence, Evidence } from "../../lib/api";
import SQLFooter from "../components/SQLFooter";

const SQL_QUERY = `SELECT 
  e.evidence_id, 
  e.crime_id, 
  e.description, 
  e.collection_date, 
  e.status 
FROM public.evidence e 
ORDER BY e.collection_date DESC;`;

export default function EvidenceManagement() {
  const [items, setItems] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [newEv, setNewEv] = useState({ crime_id: 0, description: "", collected_by: 0, status: "Logged" });
  const [saving, setSaving] = useState(false);

  const fetchEvidence = () => {
    getEvidence()
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createEvidence(newEv);
      setShowAdd(false);
      setNewEv({ crime_id: 0, description: "", collected_by: 0, status: "Logged" });
      fetchEvidence();
    } catch(err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="state-loading">Connecting to Secure Vault...</div>;
  if (error)   return <div className="state-empty text-accent">Error: {error}</div>;

  const filteredItems = items.filter(item => 
    searchTerm === "" ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.evidence_id.toString().includes(searchTerm) ||
    item.crime_id.toString().includes(searchTerm) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Evidence Management</h1>
          <p className="page-subtitle">Track chain of custody and storage logistics for investigation artifacts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Catalog Item</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8 items-start">
        {/* Evidence List */}
        <div className="w-full">
          <div className="section-header">
            <span className="section-title">Item Catalog</span>
            <input 
              type="text" 
              placeholder="Search evidence..." 
              className="form-input max-w-[200px]"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.length === 0 && <div className="col-span-2 state-empty border-0">No items match search.</div>}
            {filteredItems.map((item) => (
              <div key={item.evidence_id} className="border border-border p-4 bg-surface hover:border-accent transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-bg-base p-2 border border-border group-hover:border-accent/50">
                    <Box size={20} className="text-accent" />
                  </div>
                  <span className={`badge ${item.status === 'Logged' ? 'badge-low' : item.status === 'In Lab' ? 'badge-medium' : 'badge-closed'}`}>
                    {item.status}
                  </span>
                </div>
                <div className="text-sm font-bold mb-1">{item.description}</div>
                <div className="text-secondary text-xs font-mono mb-4">EV-{item.evidence_id} // CRIME: #{item.crime_id}</div>
                
                <div className="flex items-center gap-2 text-[10px] text-dim">
                  <Calendar size={12} />
                  <span>Collected: {new Date(item.collection_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel: Storage Summary */}
        <div className="flex flex-col gap-6">
          <div className="border border-border p-5 bg-surface">
            <div className="label mb-6 text-accent">Inventory Summary</div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-[12px] font-bold">Total Items Cataloged</div>
                <div className="font-mono text-accent">{items.length}</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-[12px] font-bold">Logged Status</div>
                <div className="font-mono text-secondary">{items.filter(i => i.status === 'Logged').length}</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-[12px] font-bold">In Forensics</div>
                <div className="font-mono text-secondary">{items.filter(i => i.status === 'In Lab').length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SQLFooter query={SQL_QUERY} />

      {showAdd && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <form className="bg-surface border border-border w-full max-w-lg p-6" onSubmit={handleCreate}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
              <h2 className="text-lg font-bold uppercase tracking-tight">Catalog Evidence</h2>
              <button type="button" onClick={() => setShowAdd(false)} className="text-secondary hover:text-primary"><X size={18}/></button>
            </div>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="form-field">
                <label className="form-label">Description / Item Name</label>
                <input required className="form-input" value={newEv.description} onChange={e => setNewEv({...newEv, description: e.target.value})} placeholder="e.g. 9mm shell casing" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-field">
                  <label className="form-label">Crime ID Link</label>
                  <input required type="number" className="form-input" value={newEv.crime_id || ''} onChange={e => setNewEv({...newEv, crime_id: parseInt(e.target.value) || 0})} placeholder="e.g. 1042" />
                </div>
                <div className="form-field">
                  <label className="form-label">Collected By (Officer ID)</label>
                  <input required type="number" className="form-input" value={newEv.collected_by || ''} onChange={e => setNewEv({...newEv, collected_by: parseInt(e.target.value) || 0})} placeholder="e.g. 4" />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Initial Status</label>
                <select className="form-select" value={newEv.status} onChange={e => setNewEv({...newEv, status: e.target.value})} required>
                  <option value="Logged">Logged</option>
                  <option value="In Lab">In Lab</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Cataloging..." : "Catalog Item →"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
