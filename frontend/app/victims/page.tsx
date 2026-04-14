// frontend/app/victims/page.tsx
"use client";

import { Users, Shield, Lock, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { getVictims, Victim } from "../../lib/api";

export default function VictimRegistry() {
  const [searchTerm, setSearchTerm] = useState("");
  const [victims, setVictims] = useState<Victim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVictims()
      .then(setVictims)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-loading">Accessing protected records...</div>;
  if (error)   return <div className="state-empty text-accent">Error: {error}</div>;

  const filteredVictims = victims.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.victim_id.toString().includes(searchTerm)
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Victim Registry</h1>
          <p className="page-subtitle">Secure management of survivor data and incident testimony.</p>
        </div>
        <button className="btn btn-primary">+ Register Victim</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-8 items-start">
        <div className="w-full">
          <div className="section-header">
            <span className="section-title">Protected Records</span>
            <div className="flex items-center gap-2 bg-surface border border-border px-2 py-1">
              <Search size={14} className="text-secondary" />
              <input 
                type="text" 
                placeholder="Search by VIC-ID..." 
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
    </>
  );
}
