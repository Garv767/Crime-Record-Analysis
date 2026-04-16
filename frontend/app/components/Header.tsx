import { Search, User, Database, Globe, Menu } from "lucide-react";
import { useState } from "react";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {


  return (
    <header className="header">
      <button className="lg:hidden text-secondary p-2 -ml-2 mr-2" onClick={onMenuClick}>
        <Menu size={20} />
      </button>

      <div className="header-search">
        <Search size={16} className="text-secondary" />
        <input 
          type="text" 
          placeholder="Search suspects, FIRs, or badge numbers..." 
          className="header-search-input"
        />
      </div>

      <div className="header-actions">
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
