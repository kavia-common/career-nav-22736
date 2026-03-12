"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export type TopBarProps = {
  onOpenSidebar: () => void;
};

/**
 * PUBLIC_INTERFACE
 * Top bar for global controls: destination selector stub + privacy indicator + profile menu stub.
 */
export function TopBar({ onOpenSidebar }: TopBarProps) {
  const [hasDestination, setHasDestination] = React.useState(false);

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

          <div className="hidden items-center gap-2 sm:flex">
            {hasDestination ? (
              <div className="flex items-center gap-2 rounded-lg bg-white/12 px-3 py-1.5 text-sm text-white ring-1 ring-inset ring-white/15">
                <span
                  className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.45)]"
                  aria-hidden="true"
                />
                Destination: Product Manager
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/10 text-white ring-1 ring-inset ring-white/15 hover:bg-white/15"
                onClick={() => setHasDestination(true)}
              >
                Set destination (placeholder)
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/90 ring-1 ring-inset ring-white/15 md:block">
            Private browsing: On
          </div>
        </div>
      </div>
    </header>
  );
}
