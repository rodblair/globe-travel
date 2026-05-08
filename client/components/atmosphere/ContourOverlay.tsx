import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Topographic contour overlay — atmospheric depth on hero/empty states.
 * Renders concentric flowing curves at low opacity. Pure SVG, no animation.
 */
export function ContourOverlay({
  className,
  density = "normal",
}: {
  className?: string;
  density?: "sparse" | "normal" | "dense";
}) {
  const lines =
    density === "sparse" ? 6 : density === "dense" ? 16 : 10;

  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-ink",
        className,
      )}
    >
      <defs>
        <filter id="contour-blur" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="0.4" />
        </filter>
      </defs>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.18"
        filter="url(#contour-blur)"
      >
        {Array.from({ length: lines }).map((_, i) => {
          const y = 80 + i * 40;
          const amp = 14 + i * 3;
          const phase = i * 0.7;
          const points = Array.from({ length: 31 })
            .map((_, j) => {
              const x = j * 40;
              const yy =
                y +
                Math.sin(j * 0.4 + phase) * amp +
                Math.sin(j * 0.13 + phase * 1.3) * (amp * 0.4);
              return `${x},${yy.toFixed(1)}`;
            })
            .join(" ");
          return <polyline key={i} points={points} />;
        })}
      </g>
    </svg>
  );
}
