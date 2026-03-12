import * as React from "react";
import { cn } from "@/lib/cn";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  titleClassName?: string;
  subtitleClassName?: string;
};

/**
 * PUBLIC_INTERFACE
 * Standard page header with title/subtitle/actions.
 * Allows optional class overrides for title and subtitle.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  titleClassName,
  subtitleClassName
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1
          className={cn(
            "cn-page-title text-3xl font-bold tracking-tight text-[#0F766E]",
            titleClassName
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className={cn("mt-1 text-sm text-zinc-600", subtitleClassName)}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
