"use client";

import { Terminal } from "lucide-react";

interface SQLFooterProps {
  query: string;
}

export default function SQLFooter({ query }: SQLFooterProps) {
  return (
    <div className="mt-20 pt-8 border-t border-border-dim opacity-80">
      <div className="flex items-center gap-2 mb-4">
        <Terminal size={16} className="text-secondary" />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">
          Core Engine Query // PostgreSQL
        </span>
      </div>
      <div className="bg-bg-base/50 p-6 border border-border-dim font-mono text-[11px] text-dim leading-relaxed overflow-x-auto whitespace-pre">
        {query}
      </div>
      <div className="mt-4 text-[10px] text-dim/50 uppercase tracking-widest text-right">
        Authenticated Audit Trail Enabled
      </div>
    </div>
  );
}
