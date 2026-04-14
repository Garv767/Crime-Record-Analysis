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
} from "lucide-react";

// Navigation entries — each maps to a route in the app
const NAV_ITEMS = [
  { href: "/",          label: "Dashboard",  icon: LayoutDashboard },
  { href: "/crimes",    label: "Crimes",     icon: AlertCircle     },
  { href: "/offenders", label: "Offenders",  icon: Users           },
  { href: "/map",       label: "Crime Map",  icon: MapPin          },
  { href: "/fir",       label: "File FIR",   icon: FileText        },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* System identity */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">CRPA//SYS</div>
        <div className="sidebar-logo-sub">Crime Intelligence v1.0</div>
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
  );
}
