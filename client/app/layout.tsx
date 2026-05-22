import type { Metadata } from "next";
import Script from "next/script";
import { inter, sourceSerif, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://globe-travel-two.vercel.app");
const siteDescription =
  "Plan group city trips, collect friend feedback, and share a polished itinerary map everyone can react to.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "Globe.travel",
  title: {
    default: "Globe.travel — Plan the trip everyone can say yes to",
    template: "%s · Globe.travel",
  },
  description: siteDescription,
  keywords: [
    "group travel planner",
    "travel itinerary app",
    "collaborative trip planning",
    "city trip planner",
    "shareable itinerary map",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Globe.travel — Plan the trip everyone can say yes to",
    description: siteDescription,
    url: siteUrl,
    siteName: "Globe.travel",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Globe.travel — Plan the trip everyone can say yes to",
    description: siteDescription,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://tiles.mapbox.com" />
        <link rel="preconnect" href="https://events.mapbox.com" />
      </head>
      <body className="antialiased bg-background text-foreground [color-scheme:light]">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WS29K6XJ');`,
          }}
        />
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WS29K6XJ"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </body>
    </html>
  );
}
