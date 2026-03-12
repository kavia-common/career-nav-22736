import * as React from "react";
import { AppLayout } from "@/components/layout/AppLayout";

/**
 * Layout wrapper for authenticated application pages.
 */
export default function AppGroupLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
