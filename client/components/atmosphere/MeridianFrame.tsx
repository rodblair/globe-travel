import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Corner reticles for photo cards / hero panels.
 * Four small L-shapes mark the corners — like a viewfinder or chart frame.
 */
export function MeridianFrame({
  className,
  inset = 8,
  length = 14,
  thickness = 1,
  color = "currentColor",
  opacity = 0.6,
}: {
  className?: string;
  inset?: number;
  length?: number;
  thickness?: number;
  color?: string;
  opacity?: number;
}) {
  const corners: Array<[string, string, string]> = [
    ["top", "left", "top-left"],
    ["top", "right", "top-right"],
    ["bottom", "left", "bottom-left"],
    ["bottom", "right", "bottom-right"],
  ];
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      {corners.map(([v, h, key]) => {
        const style: React.CSSProperties = {
          [v]: inset,
          [h]: inset,
          width: length,
          height: length,
          opacity,
        } as React.CSSProperties;
        const verticalLine: React.CSSProperties = {
          position: "absolute",
          [v]: 0,
          [h]: 0,
          width: thickness,
          height: length,
          background: color,
        } as React.CSSProperties;
        const horizontalLine: React.CSSProperties = {
          position: "absolute",
          [v]: 0,
          [h]: 0,
          width: length,
          height: thickness,
          background: color,
        } as React.CSSProperties;
        return (
          <span key={key} style={{ position: "absolute", ...style }}>
            <span style={verticalLine} />
            <span style={horizontalLine} />
          </span>
        );
      })}
    </div>
  );
}
