"use client";

import * as React from "react";

export type TopBarProps = {
  onOpenSidebar: () => void;
};

/**
 * PUBLIC_INTERFACE
 * Top bar for global controls.
 *
 * Note: Placeholder destination selector and private browsing indicator have been removed
 * per product requirements, while keeping the overall header layout intact.
 */
export function TopBar({ onOpenSidebar }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-teal-700 text-white shadow-sm">
      <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-lg p-2 text-white/90 hover:bg-white/10 lg:hidden"
            aria-label="Open navigation"
          >
            <span className="text-lg leading-none">☰</span>
          </button>

          {/* Intentionally left empty to preserve layout spacing/alignment where prior controls existed. */}
          <div className="hidden items-center gap-2 sm:flex" />
        </div>

        {/* Right side intentionally empty to preserve layout spacing/alignment where prior indicator existed. */}
        <div className="flex items-center gap-2" />
      </div>
    </header>
  );
}
