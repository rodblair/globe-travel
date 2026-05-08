"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Brass thread connecting itinerary stops in document space.
 * Renders a single SVG with a curved path through the given points.
 * Animates draw on mount; respects prefers-reduced-motion via CSS.
 */
export function ItineraryThread({
  points,
  className,
  width,
  height,
  animate = true,
}: {
  points: Array<{ x: number; y: number }>;
  className?: string;
  width: number;
  height: number;
  animate?: boolean;
}) {
  if (points.length < 2) return null;

  const path = React.useMemo(() => buildSmoothPath(points), [points]);

  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("pointer-events-none", className)}
    >
      <defs>
        <filter id="thread-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={path}
        fill="none"
        className={animate ? "route-draw" : "route-solid"}
        strokeDasharray="4 5"
      />
      {/* nodes at each point */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          className="route-node"
        />
      ))}
    </svg>
  );
}

function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const d: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const cx = (prev.x + cur.x) / 2;
    const cy = (prev.y + cur.y) / 2;
    d.push(`Q ${prev.x} ${prev.y} ${cx} ${cy}`);
    if (i === points.length - 1) {
      d.push(`T ${cur.x} ${cur.y}`);
    }
  }
  return d.join(" ");
}
