import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Globe.travel",
    short_name: "Globe",
    description:
      "Plan group city trips, collect friend feedback, and share polished itinerary maps.",
    start_url: "/?source=app-manifest",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3358e0",
    categories: ["travel", "lifestyle", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
