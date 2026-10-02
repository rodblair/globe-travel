import { Caveat, Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";

/** Display serif with the SOFT axis, for headlines, trip titles and big numerals. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
  display: "swap",
});

/** Interface sans: body copy, controls, labels. */
export const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

/** Handwritten margin notes (friends' reactions). Use sparingly. */
export const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["500", "600"],
  display: "swap",
});

/** Used sparingly for coordinates and data. */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
  display: "swap",
});
