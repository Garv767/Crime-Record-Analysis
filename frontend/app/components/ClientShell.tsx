// frontend/app/components/ClientShell.tsx
"use client";

import { useState, ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface ClientShellProps {
  children: ReactNode;
}

export default function ClientShell({ children }: ClientShellProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex flex-col w-full">
        <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
