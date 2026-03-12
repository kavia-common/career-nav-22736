"use client";

import * as React from "react";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { TopBar } from "@/components/layout/TopBar";
import { PRIMARY_NAV } from "@/lib/navigation";

export type AppLayoutProps = {
  children: React.ReactNode;
};

/**
 * PUBLIC_INTERFACE
 * Global authenticated app layout (sidebar + topbar + main content).
 */
export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-dvh bg-zinc-50">
      <div className="lg:flex">
        <SidebarNavigation
          items={PRIMARY_NAV}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main content column.
            On desktop, offset by fixed sidebar width (240px) so header/topbar is visually separate. */}
        <div className="min-w-0 flex-1 lg:pl-[240px]">
          <TopBar onOpenSidebar={() => setIsSidebarOpen(true)} />

          <main className="px-4 py-6 lg:px-6">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
