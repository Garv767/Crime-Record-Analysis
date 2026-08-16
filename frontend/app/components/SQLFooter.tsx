"use client";

import { Terminal } from "lucide-react";

interface SQLFooterProps {
  query: string;
}

export default function SQLFooter({ query }: SQLFooterProps) {
  return (
    <div className="mt-12 sm:mt-20 pt-6 sm:pt-8 border-t border-border-dim opacity-80 min-w-0">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Terminal size={16} className="text-secondary shrink-0" />
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-secondary">
          Core Engine Query // PostgreSQL
        </span>
      </div>
      <div className="bg-bg-base/50 p-3 sm:p-6 border border-border-dim font-mono text-[10px] sm:text-[11px] text-dim leading-relaxed overflow-x-auto whitespace-pre max-w-full">
        {query}
      </div>
      <div className="mt-4 text-[10px] text-dim/50 uppercase tracking-widest text-right">
        Authenticated Audit Trail Enabled
      </div>
    </div>
  );
}
