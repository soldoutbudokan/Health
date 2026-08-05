import type { NextConfig } from "next";

/**
 * Static export, deployed to Cloudflare Pages behind Cloudflare Access.
 *
 * There is no `basePath` here on purpose. GitHub Pages served this from
 * `/Health` because project sites live on a subpath; Cloudflare serves from
 * the root of its own hostname, so a basePath would push every asset one
 * level too deep and the page would come up blank.
 *
 * Access is what keeps the log private. The site is a public URL in the sense
 * that it resolves for anyone, but Cloudflare refuses to serve it without a
 * verified login, so the data baked into the build is only readable by the
 * identities on the Access policy. That is the trade that lets the log live
 * in the repo instead of behind a token the browser has to hold.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
