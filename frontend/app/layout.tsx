// frontend/app/layout.tsx
// Root layout — wraps every page with the sidebar shell and metadata.
// Fonts: Space Grotesk (headings/body) + JetBrains Mono (data/IDs).
import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CRPA — Crime Intelligence System",
  description:
    "Crime Record & Pattern Analysis dashboard for law enforcement. Track incidents, offenders, and hotspots across Chennai.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        {/* App Shell: fixed sidebar + scrollable content area */}
        <div className="app-shell">
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
