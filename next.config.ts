import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages.
 *
 * `basePath` is required because Pages serves a *project* site from a subpath
 * (`https://<user>.github.io/Health`) rather than from the domain root. Without
 * it every asset URL resolves one level too high and the page loads blank. It
 * must match the repository name — rename the repo and this changes with it.
 *
 * Image optimisation is a server feature; `unoptimized` makes `next/image`
 * emit plain <img> tags so the export can complete.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: "/Health",
  images: { unoptimized: true },
};

export default nextConfig;
