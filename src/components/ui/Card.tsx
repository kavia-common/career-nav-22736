import * as React from "react";
import { cn } from "@/lib/cn";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
};

/**
 * PUBLIC_INTERFACE
 * Card surface with optional header and actions.
 */
export function Card({
  className,
  title,
  description,
  actions,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white p-5 shadow-sm ring-1 ring-inset ring-zinc-200",
        "transition-transform hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
      {...props}
    >
      {(title || description || actions) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-zinc-600">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
