import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use /tmp locally to avoid iCloud Drive syncing build artifacts.
  // Vercel expects the default .next directory when packaging deployments.
  ...(process.env.VERCEL ? {} : { distDir: "/tmp/globe-travel-next" }),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.mapbox.com",
      },
    ],
  },
};

export default nextConfig;
