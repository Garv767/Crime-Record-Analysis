// frontend/app/officers/page.tsx
"use client";

import { Users, BadgeCheck, MapPin, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getOfficers, createOfficer, PoliceOfficer } from "../../lib/api";
import SQLFooter from "../components/SQLFooter";

const SQL_QUERY = `SELECT 
  o.officer_id, 
  o.name, 
  o.badge_number, 
  o.rank, 
  o.station 
FROM public.police_officers o 
ORDER BY o.rank DESC, o.name ASC;`;

export default function PoliceDirectory() {
  const [officers, setOfficers] = useState<PoliceOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showAdd, setShowAdd] = useState(false);
  const [newOff, setNewOff] = useState({ name: "", badge_number: 0, rank: "", station: "" });
  const [saving, setSaving] = useState(false);

  const fetchOfficers = () => {
    getOfficers()
      .then(setOfficers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchOfficers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createOfficer(newOff);
      setShowAdd(false);
      setNewOff({ name: "", badge_number: 0, rank: "", station: "" });
      fetchOfficers();
    } catch(err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="state-loading">Connecting to Secure Directory...</div>;
  if (error)   return <div className="state-empty text-accent">Error: {error}</div>;

  const filteredOfficers = officers.filter(o => 
    searchTerm === "" || 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.badge_number.toString().includes(searchTerm.toLowerCase()) ||
    o.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.station.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const total = filteredOfficers.length;
  const inspectors = filteredOfficers.filter(o => o.rank.toLowerCase().includes('inspector')).length;
  const constables = filteredOfficers.filter(o => o.rank.toLowerCase().includes('constable')).length;
  const others = total - inspectors - constables;

  const inspectorsPct = total > 0 ? Math.round((inspectors / total) * 100) : 0;
  const constablesPct = total > 0 ? Math.round((constables / total) * 100) : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Police Index</h1>
          <p className="page-subtitle">Directory of sworn officers, rank distributions, and station assignments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Personnel</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8 items-start">
        <div className="w-full">
          <div className="section-header">
            <span className="section-title">Personnel Roster</span>
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                placeholder="Search..." 
                className="form-input max-w-[150px]"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {["All", "Active", "On Field"].map((f) => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-[10px] uppercase font-bold border transition-colors ${filter === f ? 'bg-accent text-white border-accent' : 'bg-surface border-border text-secondary'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOfficers.length === 0 && <div className="col-span-2 state-empty border-0">No personnel match search.</div>}
            {filteredOfficers.map((officer) => (
              <div key={officer.officer_id} className="border border-border p-5 bg-surface flex gap-4">
                <div className="w-16 h-16 bg-bg-base border border-border flex items-center justify-center shrink-0">
                  <Users size={32} className="text-dim/50" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="font-bold truncate">{officer.name}</div>
                    <BadgeCheck size={14} className="text-accent shrink-0" />
                  </div>
                  <div className="text-[11px] text-secondary font-mono mb-3">ID: {officer.officer_id} // BADGE: {officer.badge_number}</div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[11px] text-primary font-bold">
                       <Shield size={10} className="text-accent"/>
                       <span>{officer.rank}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-dim">
                      <MapPin size={10} />
                      <span>{officer.station}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aggregate Stats Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="border border-border p-5 bg-surface">
            <div className="label mb-4 text-accent">Rank Distribution</div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Inspectors // Higher Rank</span>
                  <span className="font-mono">{inspectorsPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-border-dim">
                  <div className="h-full bg-accent" style={{ width: `${inspectorsPct}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Constables // Field Force</span>
                  <span className="font-mono">{constablesPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-border-dim">
                  <div className="h-full bg-secondary" style={{ width: `${constablesPct}%` }}></div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border-dim text-[10px] text-secondary">
               Total Personnel: <span className="font-bold text-primary">{total}</span>
            </div>
          </div>

          <div className="border border-border p-5 bg-surface/30">
            <div className="label mb-4 text-secondary">SQL Pattern // Relations</div>
            <div className="font-mono text-[10px] text-dim leading-relaxed">
              <span className="text-dim">// Joining officers with stations</span><br/>
              SELECT <br/>
              &nbsp;&nbsp;o.name, <br/>
              &nbsp;&nbsp;s.station_name,<br/>
              &nbsp;&nbsp;count(f.fir_id) as case_load<br/>
              FROM officers o<br/>
              JOIN stations s ON o.station_id = s.id<br/>
              LEFT JOIN fir_records f ON o.id = f.officer_id<br/>
              GROUP BY o.id, s.station_name;
            </div>
          </div>
        </div>
      </div>

      <SQLFooter query={SQL_QUERY} />

      {showAdd && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <form className="bg-surface border border-border w-full max-w-lg p-6" onSubmit={handleCreate}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
              <h2 className="text-lg font-bold uppercase tracking-tight">Register Personnel</h2>
              <button type="button" onClick={() => setShowAdd(false)} className="text-secondary hover:text-primary"><X size={18}/></button>
            </div>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input required className="form-input" value={newOff.name} onChange={e => setNewOff({...newOff, name: e.target.value})} placeholder="e.g. A. Kumar" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-field">
                  <label className="form-label">Badge Number</label>
                  <input required type="number" className="form-input" value={newOff.badge_number || ''} onChange={e => setNewOff({...newOff, badge_number: parseInt(e.target.value) || 0})} placeholder="e.g. 2391" />
                </div>
                <div className="form-field">
                  <label className="form-label">Rank</label>
                  <select className="form-select" value={newOff.rank} onChange={e => setNewOff({...newOff, rank: e.target.value})} required>
                    <option value="">Select Rank</option>
                    <option value="Constable">Constable</option>
                    <option value="Head Constable">Head Constable</option>
                    <option value="Sub-Inspector">Sub-Inspector</option>
                    <option value="Inspector">Inspector</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Station Assignment</label>
                <input required className="form-input" value={newOff.station} onChange={e => setNewOff({...newOff, station: e.target.value})} placeholder="e.g. Central PS" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Registering..." : "Add Personnel →"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
