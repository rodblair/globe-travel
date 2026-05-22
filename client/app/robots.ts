import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://globe-travel-two.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/login", "/signup", "/reset-password", "/t/"],
        disallow: [
          "/account",
          "/api/",
          "/bucket-list",
          "/chat",
          "/explore",
          "/globe",
          "/journal",
          "/map",
          "/onboarding",
          "/profile",
          "/saved",
          "/settings",
          "/trips",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
