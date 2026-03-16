import type { NextConfig } from "next";
import path from "path";

/**
 * Next.js configuration for Career Navigator frontend.
 *
 * Preview/proxy environments sometimes mount the app under a path prefix
 * (e.g. https://host/<prefix>/...), while the dev server is still running at `/`.
 * If Next is unaware of this prefix, app-router navigation will hit unknown routes and
 * show the built-in NotFound page even though `curl /` works.
 *
 * We therefore support an env-driven basePath/assetPrefix:
 * - Set `NEXT_PUBLIC_BASE_PATH` (or `REACT_APP_BASE_PATH`) to the proxy mount path,
 *   e.g. `/preview/abc123`.
 * - Leave empty/undefined for local dev at `/`.
 *
 * NOTE: This repo contains an additional lockfile at the workspace root, which can cause
 * Next.js to infer the wrong "workspace root" in dev (warning about multiple lockfiles).
 * Setting `outputFileTracingRoot` pins Next's root to this application directory so the
 * dev server and tracing behave consistently in remote preview environments.
 */

// PUBLIC_INTERFACE
function normalizeBasePath(raw: string | undefined): string {
  /**
   * Normalize an env-provided base path for Next.js basePath/assetPrefix usage.
   *
   * Rules:
   * - undefined/empty => ""
   * - must be a path, not a full URL
   * - ensures leading slash
   * - removes trailing slash (Next expects no trailing slash)
   */
  if (!raw) return "";

  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Disallow passing full URLs accidentally (assetPrefix supports it, basePath doesn't).
  if (/^https?:\/\//i.test(trimmed)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_BASE_PATH/REACT_APP_BASE_PATH (expected path like "/preview/xyz", got URL): ${trimmed}`
    );
  }

  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const noTrailing = withLeading.length > 1 ? withLeading.replace(/\/+$/, "") : withLeading;
  return noTrailing === "/" ? "" : noTrailing;
}

const basePath = normalizeBasePath(
  process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.REACT_APP_BASE_PATH
);

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Ensure Next does not pick the monorepo/workspace root due to a second lockfile.
  outputFileTracingRoot: path.join(process.cwd()),

  // When mounted under a reverse-proxy subpath (preview), make routing + asset URLs work.
  basePath,
  assetPrefix: basePath || undefined
};

export default nextConfig;
