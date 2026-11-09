import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Zero running cost: a static site on the CDN, no server functions. AI runs in the browser or is
  // computed ahead of time and committed as data.
  output: "export",
  // Cost rule: no Vercel image optimisation (a static export can't use it anyway).
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
