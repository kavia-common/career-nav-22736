"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/lib/navigation";

export type SidebarNavigationProps = {
  items: NavItem[];
  isOpen: boolean;
  onClose: () => void;
};

function normalizePath(path: string | null | undefined) {
  if (!path) return "/";
  // Remove trailing slashes except for root.
  const cleaned = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return cleaned || "/";
}

function startsWithPathSegment(pathname: string, base: string) {
  // Match `/base` and `/base/...` but not `/baseball`.
  return pathname === base || pathname.startsWith(base + "/");
}

/**
 * Determines whether a sidebar nav item should be marked active for the current route.
 * This supports "route groups" where one nav item represents multiple related pages.
 */
function isNavItemActive(pathnameRaw: string, hrefRaw: string) {
  const pathname = normalizePath(pathnameRaw);
  const href = normalizePath(hrefRaw);

  if (href === "/") return pathname === "/";

  // Standard exact / nested matching for most items.
  if (startsWithPathSegment(pathname, href)) return true;

  // Product-specific grouping rules:
  // - "Build Persona" should remain active across persona onboarding sub-steps.
  // - "Draft Persona" should be active for all persona pages (index, analyze, draft).
  // - Primary journey destinations (Multiverse/Roadmap/Marketplace) have both top-level
  //   routes (e.g. `/multiverse`) and journey-prefixed routes (e.g. `/journey/multiverse`);
  //   these should share the same active styling in the sidebar.
  if (href === "/journey/build-profile") {
    return (
      startsWithPathSegment(pathname, "/journey/build-profile") ||
      startsWithPathSegment(pathname, "/journey/persona")
    );
  }

  if (href === "/journey/persona/draft") {
    return startsWithPathSegment(pathname, "/journey/persona");
  }

  // Make sure `/journey/*` pages highlight their corresponding primary nav item.
  // This keeps active styling consistent with "Skill Validation" (which has a single route).
  if (href === "/multiverse") {
    return startsWithPathSegment(pathname, "/journey/multiverse");
  }

  if (href === "/roadmap") {
    return startsWithPathSegment(pathname, "/journey/roadmap");
  }

  if (href === "/marketplace") {
    return startsWithPathSegment(pathname, "/journey/marketplace");
  }

  return false;
}

/**
 * PUBLIC_INTERFACE
 * Sidebar navigation (drawer on mobile, fixed on desktop).
 */
export function SidebarNavigation({ items, isOpen, onClose }: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-zinc-900/30 backdrop-blur-sm transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-[240px]",
          // Palette per requirements
          "bg-[#0F766E] text-white",
          // Visual separation (right-edge shadow)
          "shadow-[8px_0_24px_rgba(15,118,110,0.22)]",
          "ring-1 ring-inset ring-white/10",
          "transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Keep fixed on desktop too (main content offsets itself)
          "lg:fixed lg:z-40"
        )}
        aria-label="Primary"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-2 p-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-wide text-white">
                Career Navigator
              </p>
            </div>
            <button
              className="rounded-lg p-2 text-white/90 hover:bg-white/10 transition-colors lg:hidden"
              onClick={onClose}
              aria-label="Close navigation"
              type="button"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-5">
            <ul className="space-y-1">
              {items.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                        // Hover interactions (slide + background)
                        "transition-all duration-200 will-change-transform",
                        "hover:translate-x-0.5",
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-white/90 hover:bg-[#115E59] hover:text-white"
                      )}
                    >
                      {/* Active indicator bar */}
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full transition-opacity duration-200",
                          isActive ? "bg-[#14B8A6] opacity-100" : "opacity-0"
                        )}
                        aria-hidden="true"
                      />

                      {/* Icon dot (scales on hover; teal highlight when active) */}
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full transition-all duration-200",
                          "group-hover:scale-110",
                          isActive
                            ? "bg-white shadow-[0_0_14px_rgba(255,255,255,0.45)]"
                            : "bg-white/55",
                          "group-hover:bg-white group-hover:shadow-[0_0_14px_rgba(255,255,255,0.35)]"
                        )}
                        aria-hidden="true"
                      />

                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 rounded-xl bg-white/10 p-4 ring-1 ring-inset ring-white/10">
              <p className="text-xs font-semibold text-white">Tip</p>
              <p className="mt-1 text-xs text-white/85">
                Upload your resume and key documents, then generate a draft persona.
              </p>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
