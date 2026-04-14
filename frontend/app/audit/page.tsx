// frontend/app/audit/page.tsx
"use client";

import { Terminal, Shield, Eye, Calendar, User } from "lucide-react";
import { useEffect, useState } from "react";
import { getAuditLogs, AuditLog } from "../../lib/api";

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAuditLogs()
      .then(setLogs)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-loading">Mounting Audit Core...</div>;
  if (error)   return <div className="state-empty text-accent">Error: {error}</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Audit</h1>
          <p className="page-subtitle">Immutable trail of all user interactions and record mutations.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost border border-border">Download CSV</button>
          <button className="btn btn-primary">Verify Integrity</button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Terminal Style Log Viewer */}
        <div className="bg-[#050505] border border-border p-4 font-mono text-[12px] min-h-[400px]">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
            <Terminal size={14} className="text-secondary" />
            <span className="text-secondary font-bold uppercase tracking-widest text-[10px]">Security Console // tail -f /var/log/crpa.audit</span>
          </div>

          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.log_id} className="group hover:bg-white/5 p-1">
                <span className="text-dim mr-3">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className="text-accent mr-3">AUTH:{log.officer_name}</span>
                <span className={`mr-3 ${log.action.includes('DELETE') ? 'text-red-500' : 'text-primary'}`}>{log.action}</span>
                <span className="text-secondary mr-3">&gt; {log.target}</span>
                <span className="text-dim shrink-0 h-hidden md:inline ml-auto float-right text-[10px]">SRC: {log.ip_address}</span>
              </div>
            ))}
            <div className="text-primary animate-pulse mt-4">_</div>
          </div>
        </div>

        {/* Technical Context */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-border p-5 bg-surface">
            <div className="label mb-4 text-accent">Auditing Logic // Trigger Pattern</div>
            <div className="font-mono text-[10px] text-dim leading-relaxed bg-bg-base p-4 border border-border-dim">
              <span className="text-dim">// Database-level audit trigger</span><br/>
              CREATE TRIGGER audit_log_trigger<br/>
              AFTER INSERT OR UPDATE OR DELETE ON crimes<br/>
              FOR EACH ROW EXECUTE FUNCTION log_action();<br/>
              <br/>
              <span className="text-dim">// Logs user_id from session context</span>
            </div>
          </div>

          <div className="border border-border p-5 bg-surface flex flex-col justify-center gap-4">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-secondary" />
              <div>
                <div className="text-[12px] font-bold">Immutable Ledger</div>
                <div className="text-[11px] text-secondary">Logs are hash-locked every 24 hours to prevent tampering by administrative users.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-secondary" />
              <div>
                <div className="text-[12px] font-bold">Watchdog Protocol</div>
                <div className="text-[11px] text-secondary">Suspicious activity (e.g., bulk exports) triggers a real-time notify event.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
