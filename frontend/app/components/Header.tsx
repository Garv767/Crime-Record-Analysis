import { Search, User, Database, Globe, Menu } from "lucide-react";
import { useState } from "react";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {


  return (
    <header className="header">
      <button 
        className="lg:hidden text-secondary hover:text-primary p-2 -ml-2 mr-1 flex items-center justify-center shrink-0" 
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      <div className="header-search">
        <Search size={15} className="text-secondary shrink-0" />
        <input 
          type="text" 
          placeholder="Search records, suspects, FIRs..." 
          className="header-search-input min-w-0"
        />
      </div>

      <div className="header-actions hidden lg:flex">
        {/* Connectivity Status Badges */}
        <div className="connection-badges h-hidden md:flex">
          <div className="conn-badge">
            <Globe size={11} className="text-secondary" />
            <span>API: localhost:8080 (serverless function)</span>
          </div>
          <div className="conn-badge">
            <Database size={11} className="text-secondary" />
            <span>DB: Supabase/PG</span>
          </div>
        </div>

      </div>
    </header>
  );
}
