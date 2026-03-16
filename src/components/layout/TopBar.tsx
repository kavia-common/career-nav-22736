"use client";

import * as React from "react";

export type TopBarProps = {
  onOpenSidebar: () => void;
};

/**
 * PUBLIC_INTERFACE
 * Top bar for global controls.
 *
 * Left-side brand (logo + text) removed per design request while keeping:
 * - Mobile hamburger button on the left
 * - Profile/avatar control on the right
 */
export function TopBar({ onOpenSidebar }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-teal-700 text-white shadow-sm">
      <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
        {/* Left: hamburger (mobile) */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-lg p-2 text-white/90 hover:bg-white/10 lg:hidden"
            aria-label="Open navigation"
          >
            <span className="text-lg leading-none">☰</span>
          </button>
        </div>

        {/* Right: profile/avatar control */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-white/10 p-1 pr-2 text-white/95 ring-1 ring-white/15 transition hover:bg-white/15 hover:ring-white/25"
            aria-label="Open profile menu"
          >
            <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-white/15 ring-1 ring-white/20">
              {/* Placeholder avatar (can be swapped to real user avatar later) */}
              <span className="text-sm font-semibold leading-none">CN</span>
            </span>
            <span className="hidden text-sm font-medium sm:inline">Profile</span>
          </button>
        </div>
      </div>
    </header>
  );
}
