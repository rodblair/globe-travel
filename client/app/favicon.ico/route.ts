import { readFile } from "node:fs/promises";
import path from "node:path";

// Browsers still request /favicon.ico by default; serve the brand mark for them.
export async function GET() {
  const svg = await readFile(path.join(process.cwd(), "app", "icon.svg"));
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
