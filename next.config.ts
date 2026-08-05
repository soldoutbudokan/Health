import type { NextConfig } from "next";

/**
 * Static export, because this ships to GitHub Pages — a plain file host with no
 * Node runtime. `output: "export"` writes a fully pre-rendered site to `out/`.
 *
 * `basePath` is required because Pages serves a *project* site from a subpath
 * (`https://<user>.github.io/Health`), not from the domain root. Without it
 * every asset URL would resolve one level too high and the page would load
 * blank. It must match the repository name.
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
