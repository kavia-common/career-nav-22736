import type { NextConfig } from "next";
import path from "path";

/**
 * Next.js configuration for Career Navigator frontend.
 *
 * NOTE: This repo contains an additional lockfile at the workspace root, which can cause
 * Next.js to infer the wrong "workspace root" in dev (warning about multiple lockfiles).
 * Setting `outputFileTracingRoot` pins Next's root to this application directory so the
 * dev server and tracing behave consistently in remote preview environments.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Ensure Next does not pick the monorepo/workspace root due to a second lockfile.
  outputFileTracingRoot: path.join(process.cwd())
};

export default nextConfig;
