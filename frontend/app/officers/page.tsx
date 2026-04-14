// frontend/app/officers/page.tsx
"use client";

import { Users, BadgeCheck, MapPin, Phone, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { getOfficers, PoliceOfficer } from "../../lib/api";

export default function PoliceDirectory() {
  const [officers, setOfficers] = useState<PoliceOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    getOfficers()
      .then(setOfficers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-loading">Connecting to Secure Directory...</div>;
  if (error)   return <div className="state-empty text-accent">Error: {error}</div>;

  const total = officers.length;
  const inspectors = officers.filter(o => o.rank.toLowerCase().includes('inspector')).length;
  const constables = officers.filter(o => o.rank.toLowerCase().includes('constable')).length;
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
        <button className="btn btn-primary">+ Add Personnel</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8 items-start">
        <div className="w-full">
          <div className="section-header">
            <span className="section-title">Personnel Roster</span>
            <div className="flex gap-2">
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
            {officers.map((officer) => (
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
    </>
  );
}
