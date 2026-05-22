import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://globe-travel-two.vercel.app";
const publicShareSlug = process.env.NEXT_PUBLIC_LAUNCH_SHARE_SLUG ?? "x3m2c8cnws";

const routes = [
  { path: "/", priority: 1 },
  { path: "/pricing", priority: 0.8 },
  { path: `/t/${publicShareSlug}`, priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: route.priority,
  }));
}
