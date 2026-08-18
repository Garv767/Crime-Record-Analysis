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
  { href: "/crimes",    label: "Incidents",  icon: AlertCircle     },
  { href: "/fir",       label: "FIR Tracking", icon: FileText      },
  { href: "/offenders", label: "Offender Registry", icon: Users    },
  { href: "/officers",  label: "Police Index", icon: Users         },
  { href: "/victims",   label: "Victim Registry", icon: Users      },
  { href: "/evidence",  label: "Evidence",   icon: FileText        },
  { href: "/analytics", label: "Analytics",  icon: LayoutDashboard },
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

      {/* Navigation links */}
      <nav className="sidebar-nav overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          // Mark active: exact match for root, prefix match for others
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setIsOpen(false)}
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Version & DB indicator */}
      </aside>
    </>
  );
}
