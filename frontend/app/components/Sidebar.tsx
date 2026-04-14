// frontend/app/components/Sidebar.tsx
// Persistent vertical navigation sidebar.
// Uses Next.js usePathname to highlight the active route with a crimson left border.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertCircle,
  Users,
  MapPin,
  FileText,
  X,
} from "lucide-react";

// Navigation entries — each maps to a route in the app
const NAV_ITEMS = [
  { href: "/",          label: "Dashboard",  icon: LayoutDashboard },
  { href: "/crimes",    label: "Crimes",     icon: AlertCircle     },
  { href: "/fir",       label: "FIR Tracking", icon: FileText      },
  { href: "/officers",  label: "Police Index", icon: Users          },
  { href: "/victims",   label: "Victim Registry", icon: Users       },
  { href: "/evidence",  label: "Evidence",   icon: FileText        },
  { href: "/analytics", label: "Analytics",  icon: LayoutDashboard },
  { href: "/audit",     label: "Activity Logs", icon: FileText      },
  { href: "/reports",   label: "Reports",    icon: FileText        },
  { href: "/map",       label: "Crime Map",  icon: MapPin          },
] as const;

export default function Sidebar({ 
  isOpen, 
  setIsOpen 
}: { 
  isOpen: boolean; 
  setIsOpen: (open: boolean) => void 
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-[95]" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* System identity */}
        <div className="sidebar-logo flex items-center justify-between">
          <div>
            <div className="sidebar-logo-title">CRPA//SYS</div>
            <div className="sidebar-logo-sub">Crime Intelligence v1.0</div>
          </div>
          <button className="lg:hidden text-dim" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>

      {/* Navigation links */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          // Mark active: exact match for root, prefix match for others
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Version & DB indicator */}
      <div className="sidebar-footer">
        API → localhost:8080
        <br />
        DB → Supabase / PostgreSQL
      </div>
      </aside>
    </>
  );
}
