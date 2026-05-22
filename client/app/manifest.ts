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
    background_color: "#f6f1e6",
    theme_color: "#0c1f33",
    categories: ["travel", "lifestyle", "productivity"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
        purpose: "any",
      },
    ],
  };
}
