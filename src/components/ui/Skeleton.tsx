import * as React from "react";
import { cn } from "@/lib/cn";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  rounded?: "sm" | "md" | "lg" | "xl";
};

/**
 * PUBLIC_INTERFACE
 * Simple skeleton loader block.
 */
export function Skeleton({ className, rounded = "lg", ...props }: SkeletonProps) {
  const roundedClass =
    rounded === "sm"
      ? "rounded-sm"
      : rounded === "md"
        ? "rounded-md"
        : rounded === "lg"
          ? "rounded-lg"
          : "rounded-xl";

  return (
    <div
      className={cn(
        "animate-pulse bg-zinc-100 ring-1 ring-inset ring-zinc-200/60",
        roundedClass,
        className
      )}
      {...props}
    />
  );
}
