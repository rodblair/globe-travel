"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Magnitude = 1 | 2 | 3 | 4 | 5;
type Pillar = "city" | "nature" | "coastal" | "desert";

/**
 * Destination pin — brass star with optional pillar halo.
 * Magnitude (1–5) scales size; smaller pins for tertiary places.
 * Used on maps, trip overviews, constellation grids.
 */
export function DestinationPin({
  magnitude = 3,
  pillar,
  label,
  className,
  selected = false,
  number,
}: {
  magnitude?: Magnitude;
  pillar?: Pillar;
  label?: string;
  className?: string;
  selected?: boolean;
  number?: number;
}) {
  return (
    <span
      role={label ? "img" : undefined}
      className={cn(
        "pin-host relative inline-flex items-center justify-center",
        "transition-transform duration-200 ease-out",
        selected && "scale-110",
        className,
      )}
      style={{
        ["--pin-size" as string]:
          magnitude === 1
            ? "28px"
            : magnitude === 2
              ? "24px"
              : magnitude === 3
                ? "20px"
                : magnitude === 4
                  ? "16px"
                  : "12px",
      }}
      aria-label={label}
    >
      {/* pillar halo */}
      {pillar && (
        <span
          aria-hidden
          className="absolute inset-0 -m-2 rounded-full opacity-50 blur-md"
          style={{
            background: `var(--pillar-${pillar})`,
          }}
        />
      )}
      {/* outer breathing ring (only on hover/focus) */}
      <span
        aria-hidden
        className="pin-breathe absolute inset-0 rounded-full"
      />
      {/* core */}
      <span
        aria-hidden
        className={cn(
          "relative inline-flex items-center justify-center rounded-full",
          "bg-[var(--brass)] text-[var(--brass-text)]",
          "shadow-[0_0_0_1.5px_var(--paper),0_2px_6px_rgb(0_0_0/0.18)]",
        )}
        style={{
          width: "var(--pin-size)",
          height: "var(--pin-size)",
          boxShadow: selected
            ? "0 0 0 1.5px var(--paper), 0 0 0 4px var(--brass-glow), 0 2px 8px rgb(0 0 0 / 0.24)"
            : undefined,
        }}
      >
        {number != null && (
          <span className="t-mono text-[0.6875rem] font-semibold leading-none">
            {number}
          </span>
        )}
      </span>
    </span>
  );
}
