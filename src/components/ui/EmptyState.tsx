import * as React from "react";
import { Card } from "@/components/ui/Card";

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

/**
 * PUBLIC_INTERFACE
 * Consistent empty state surface used when prerequisite data is missing.
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          {description && <p className="mt-1 text-sm text-zinc-600">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </Card>
  );
}
