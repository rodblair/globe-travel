import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Subtle radial cluster glow — used behind grouped items (saved trips,
 * itinerary days). Pure decoration; non-interactive.
 */
export function ConstellationField({
  className,
  intensity = "soft",
}: {
  className?: string;
  intensity?: "soft" | "warm";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        className="absolute -left-1/4 top-1/3 h-[60%] w-[60%] constellation-glow"
        style={{ filter: "blur(40px)", opacity: intensity === "warm" ? 1 : 0.55 }}
      />
      <div
        className="absolute right-[-10%] top-[-10%] h-[55%] w-[55%] constellation-glow"
        style={{
          filter: "blur(50px)",
          opacity: intensity === "warm" ? 0.9 : 0.45,
          background: `radial-gradient(ellipse at center, color-mix(in oklch, var(--horizon, var(--dusty-aqua)), transparent 90%) 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
