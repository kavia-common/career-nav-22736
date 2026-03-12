import * as React from "react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";

export type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
};

/**
 * PUBLIC_INTERFACE
 * Small KPI card used in dashboards and summary rows.
 */
export function StatCard({ label, value, hint, icon, className }: StatCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-zinc-600">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
        </div>
        {icon && (
          <div className="rounded-lg bg-teal-50 p-2 text-teal-700 ring-1 ring-inset ring-teal-100">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
