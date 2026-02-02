import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  // Increase timeout for scraping if deploying to Vercel (functions)
  // but locally it's fine.
  experimental: {
    // serverActions: {
    //   bodySizeLimit: '2mb',
    // },
  },
};

export default nextConfig;
