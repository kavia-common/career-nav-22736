import * as React from "react";
import { headers } from "next/headers";
import { AppLayout } from "@/components/layout/AppLayout";

/**
 * Layout wrapper for authenticated application pages.
 *
 * Provides a deterministic pathname to the client AppLayout so the sidebar's
 * active link state is identical between server render and client hydration.
 */
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = headers();

  // Prefer `next-url` (set by Next.js) and fall back to `x-invoke-path` in some runtimes.
  // If neither is present, fall back to root.
  const pathname = h.get("next-url") ?? h.get("x-invoke-path") ?? "/";

  return <AppLayout pathname={pathname}>{children}</AppLayout>;
}
