import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use /tmp to avoid iCloud Drive syncing .next build artifacts
  distDir: "/tmp/globe-travel-next",
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
