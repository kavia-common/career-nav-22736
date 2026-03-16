"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type MultiverseHeadingProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;

  /**
   * If true, renders a subtle ambient background block behind the heading.
   * Intended for pages that want the “Multiverse” premium feel at the top.
   */
  showAmbient?: boolean;

  /**
   * If true, renders a few floating particles around the title.
   * Keep this subtle—these are decorative.
   */
  showParticles?: boolean;
};

function Particle({
  className,
  style
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("cn-particle cn-particle-drift", className)}
      style={style}
    />
  );
}

/**
 * Build the exact same particle layout used on the Career Multiverse page heading:
 * - 12 small floating dots
 * - deterministic positions/sizes/durations/delays (no randomness)
 *
 * Keeping this logic in the shared heading component ensures Draft Persona, Skill Validation,
 * Roadmap, and Marketplace match the Career Multiverse heading identically.
 */
function getCareerMultiverseParticleField() {
  return Array.from({ length: 12 }).map((_, i) => {
    const left = (i * 7 + (i % 3) * 5) % 100;
    const top = (i % 4) * 20 + 10;
    const size = 4 + (i % 4) * 2;
    const duration = 7 + (i % 5) * 1.4;
    const delay = (i % 6) * 0.35;

    return {
      key: i,
      style: {
        position: "absolute",
        left: `${left}%`,
        top: `${top}%`,
        width: `${size}px`,
        height: `${size}px`,
        ["--cn-particle-duration" as any]: `${duration}s`,
        ["--cn-particle-delay" as any]: `${delay}s`
      } as React.CSSProperties
    };
  });
}

/**
 * PUBLIC_INTERFACE
 * MultiverseHeading
 *
 * Shared premium heading used by Career Multiverse and other “hero” pages:
 * - Entrance animation for title + subtitle
 * - Hover shimmer/glow (via existing .cn-page-title styles)
 * - Optional ambient background and subtle particles
 */
export function MultiverseHeading({
  title,
  subtitle,
  actions,
  className,
  titleClassName,
  subtitleClassName,
  showAmbient = true,
  showParticles = true
}: MultiverseHeadingProps) {
  return (
    <div className={cn("relative mb-6", className)}>
      {showAmbient && (
        <div
          className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-[180px] overflow-hidden"
          aria-hidden="true"
        >
          <div className="cn-mv-ambient" />
          <div className="cn-mv-grid" />
          <div className="cn-mv-glow cn-mv-glow--a" />
          <div className="cn-mv-glow cn-mv-glow--b" />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative min-w-0">
          {showParticles && (
            <div className="pointer-events-none absolute -inset-x-6 -top-5 -bottom-4 -z-10">
              {getCareerMultiverseParticleField().map((p) => (
                <Particle key={p.key} style={p.style} />
              ))}
            </div>
          )}

          <h1
            className={cn(
              // Base title hover shimmer/glow is already defined in globals.css under .cn-page-title
              "cn-page-title cn-page-title--teal text-3xl font-bold tracking-tight",
              "cn-enter-up",
              titleClassName
            )}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className={cn(
                "mt-1 text-sm cn-page-subtitle",
                "cn-subtext-enter",
                subtitleClassName
              )}
              style={
                {
                  // Make subtitle entrance slightly after title.
                  ["--cn-subtext-delay" as any]: "180ms"
                } as React.CSSProperties
              }
            >
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
