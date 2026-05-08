import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Compass rose — empty-state and brand mark.
 * Hairline strokes, brass north needle, serif cardinal letters.
 */
export function CompassRose({
  className,
  size = 96,
  showLabels = true,
  spinning = false,
}: {
  className?: string;
  size?: number;
  showLabels?: boolean;
  spinning?: boolean;
}) {
  const r = 50;

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="-60 -60 120 120"
        className={cn(
          "h-full w-full text-ink",
          spinning && "animate-[spin-slow_120s_linear_infinite]",
        )}
      >
        {/* outer ring */}
        <circle
          cx="0"
          cy="0"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.45"
        />
        <circle
          cx="0"
          cy="0"
          r={r - 6}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.4"
          opacity="0.25"
        />
        {/* tick marks every 15° */}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * 15 * Math.PI) / 180;
          const inner = i % 6 === 0 ? r - 12 : i % 2 === 0 ? r - 8 : r - 5;
          const x1 = (Math.sin(a) * inner).toFixed(3);
          const y1 = (-Math.cos(a) * inner).toFixed(3);
          const x2 = (Math.sin(a) * (r - 1)).toFixed(3);
          const y2 = (-Math.cos(a) * (r - 1)).toFixed(3);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={i % 6 === 0 ? "0.8" : "0.4"}
              opacity={i % 6 === 0 ? 0.6 : 0.3}
            />
          );
        })}
        {/* brass north needle (filled triangle) */}
        <polygon
          points={`0,${-r + 6} -4,0 0,2 4,0`}
          fill="var(--brass)"
          opacity="0.95"
        />
        {/* south needle (ink) */}
        <polygon
          points={`0,${r - 6} -3,0 0,-2 3,0`}
          fill="currentColor"
          opacity="0.55"
        />
        {/* center pivot */}
        <circle cx="0" cy="0" r="1.6" fill="var(--brass)" />
      </svg>
      {showLabels && (
        <div className="pointer-events-none absolute inset-0">
          {(
            [
              ["N", "top-1 left-1/2 -translate-x-1/2"],
              ["E", "right-1 top-1/2 -translate-y-1/2"],
              ["S", "bottom-1 left-1/2 -translate-x-1/2"],
              ["W", "left-1 top-1/2 -translate-y-1/2"],
            ] as const
          ).map(([letter, pos]) => (
            <span
              key={letter}
              className={cn(
                "absolute t-serif text-[0.6875rem] font-medium tracking-[0.1em] text-ink-2",
                pos,
              )}
            >
              {letter}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
