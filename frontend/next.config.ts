import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages deployment
  output: 'export',

  // Unoptimized images (required for SSG)
  images: {
    unoptimized: true,
  },

  // Base path for GitHub Pages (adjust if repo is not at root)
  // Example: if deploying to 'username.github.io/webapp', set to '/webapp'
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',

  // Disable API routes (not supported on static hosts)
  // All data fetching happens client-side via Supabase
};

export default nextConfig;
