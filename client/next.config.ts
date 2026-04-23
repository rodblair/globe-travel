import type { NextConfig } from "next";

const isVercelBuild = Boolean(process.env.VERCEL_ENV || process.env.VERCEL_URL);

const nextConfig: NextConfig = {
  // Use /tmp locally to avoid iCloud Drive syncing build artifacts.
  // Vercel expects the default .next directory when packaging deployments.
  ...(isVercelBuild ? {} : { distDir: "/tmp/globe-travel-next" }),
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
