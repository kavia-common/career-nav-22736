import * as React from "react";
import { cn } from "@/lib/cn";

export type Step = {
  id: string;
  title: string;
  description?: string;
  status: "complete" | "current" | "upcoming";
};

export type ProgressStepperProps = {
  steps: Step[];
  className?: string;
};

/**
 * PUBLIC_INTERFACE
 * Simple vertical progress stepper (Onboarding).
 */
export function ProgressStepper({ steps, className }: ProgressStepperProps) {
  return (
    <ol className={cn("space-y-3", className)}>
      {steps.map((s) => (
        <li
          key={s.id}
          className={cn(
            "flex gap-3 rounded-xl p-3 ring-1 ring-inset",
            s.status === "complete"
              ? "bg-teal-50 ring-teal-100"
              : s.status === "current"
                ? "bg-white ring-zinc-200"
                : "bg-zinc-50 ring-zinc-200"
          )}
        >
          <div
            className={cn(
              "mt-0.5 h-6 w-6 shrink-0 rounded-full ring-2 ring-inset",
              s.status === "complete"
                ? "bg-teal-600 ring-teal-600"
                : s.status === "current"
                  ? "bg-white ring-teal-300"
                  : "bg-white ring-zinc-300"
            )}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">{s.title}</p>
            {s.description && (
              <p className="mt-1 text-xs text-zinc-600">{s.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
