import * as React from "react";
import { ContourOverlay } from "./ContourOverlay";
import { cn } from "@/lib/utils";

/**
 * Atmospheric hero. Replaces dark starfield with a single slow gradient drift.
 * Predawn ink at the top, cream paper through the middle, brass strip near the
 * horizon line. Generous space for serif headline + supporting line.
 */
export function HorizonHero({
  className,
  children,
  coordinate,
  variant = "dawn",
}: {
  className?: string;
  children?: React.ReactNode;
  coordinate?: string;
  variant?: "dawn" | "dusk" | "noon";
}) {
  const gradient =
    variant === "dusk"
      ? "linear-gradient(to bottom, #2b3a4f 0%, #80614a 38%, #d6a268 62%, var(--paper) 100%)"
      : variant === "noon"
        ? "linear-gradient(to bottom, #b9d3df 0%, #d8dfd6 50%, var(--paper) 100%)"
        : // dawn — default
          "linear-gradient(to bottom, #1a2a3e 0%, #4d5b6e 28%, #c8a06a 58%, var(--paper) 100%)";

  return (
    <section
      className={cn("relative w-full overflow-hidden", className)}
      style={{ background: gradient }}
    >
      {/* horizon line */}
      <div
        aria-hidden
        className="absolute inset-x-0 z-[1] pointer-events-none"
        style={{
          top: "62%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, color-mix(in oklch, var(--brass), transparent 30%) 20%, color-mix(in oklch, var(--brass), transparent 10%) 50%, color-mix(in oklch, var(--brass), transparent 30%) 80%, transparent 100%)",
          boxShadow: "0 0 12px var(--brass-glow)",
        }}
      />
      {/* contours float over the lower paper band */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[55%]">
        <ContourOverlay density="sparse" className="opacity-60" />
      </div>
      {/* paper grain */}
      <div aria-hidden className="paper-grain absolute inset-0 z-[1] pointer-events-none" />

      {coordinate && (
        <div className="pointer-events-none absolute right-6 top-6 z-[2] t-mono t-num text-[0.6875rem] tracking-[0.16em] text-paper/85">
          {coordinate}
        </div>
      )}

      <div className="relative z-[2] flex flex-col w-full h-full min-h-inherit">
        {children}
      </div>
    </section>
  );
}
