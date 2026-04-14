// frontend/app/evidence/page.tsx
"use client";

import { Box, MapPin, Calendar, Clock, Lock, FileText, CheckCircle } from "lucide-react";

// Mock data for evidence items
import { useEffect, useState } from "react";
import { getEvidence, Evidence } from "../../lib/api";

export default function EvidenceManagement() {
  const [items, setItems] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEvidence()
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-loading">Connecting to Secure Vault...</div>;
  if (error)   return <div className="state-empty text-accent">Error: {error}</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Evidence Management</h1>
          <p className="page-subtitle">Track chain of custody and storage logistics for investigation artifacts.</p>
        </div>
        <button className="btn btn-primary">+ Catalog Item</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8 items-start">
        {/* Evidence List */}
        <div className="w-full">
          <div className="section-header">
            <span className="section-title">Item Catalog</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
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

            <div className="mt-8 pt-4 border-t border-border-dim text-[10px] font-mono text-secondary">
              <div className="text-secondary mb-2">// System Node</div>
              VAULT-PROC-01<br/>
              Status: <span className="text-green-500">OPERATIONAL</span>
            </div>
          </div>

          <div className="border border-border p-5 bg-surface/30">
            <div className="label mb-4 text-secondary">Catalog Notice</div>
            <div className="text-[11px] text-dim leading-relaxed">
              All physical evidence must be tagged with a unique barcode linked to the EV-ID. 
              Chain of custody logs are automatically updated upon storage intake.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
