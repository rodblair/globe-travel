"use client";

import * as React from "react";
import Link from "next/link";
import { CompassRose } from "./CompassRose";
import { ContourOverlay } from "./ContourOverlay";

/**
 * Two-column auth canvas. Left: atmospheric ink panel with serif quote.
 * Right: paper canvas form on cream. Shared by login / signup / reset.
 */
export function AuthCanvas({
  side = "right",
  panelTitle,
  panelSubtitle,
  panelKicker,
  children,
}: {
  side?: "left" | "right";
  panelTitle: string;
  panelSubtitle: string;
  panelKicker?: string;
  children: React.ReactNode;
}) {
  const formClasses =
    "relative flex w-full lg:w-1/2 items-center justify-center px-6 py-12 bg-paper";
  const panel = (
    <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden bg-[#0c1f33] text-paper">
      {/* atmospheric gradient */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #0c1f33 0%, #1a2e44 32%, #2e466e 70%, #6a7a8e 100%)",
        }}
      />
      {/* contour band */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 opacity-50">
        <ContourOverlay density="normal" className="text-paper" />
      </div>
      {/* horizon line */}
      <div
        aria-hidden
        className="absolute inset-x-0 z-[1]"
        style={{
          top: "70%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, color-mix(in oklch, var(--brass), transparent 30%) 30%, color-mix(in oklch, var(--brass), transparent 30%) 70%, transparent 100%)",
          boxShadow: "0 0 14px var(--brass-glow)",
        }}
      />
      {/* paper grain */}
      <div className="paper-grain absolute inset-0" />

      <div className="relative z-10 flex flex-col justify-between w-full p-12">
        <Link href="/" className="flex items-center gap-3 group">
          <CompassRose size={36} showLabels={false} />
          <span className="t-serif text-[1.0625rem] tracking-[-0.005em] text-paper">
            Globe<span className="text-paper/65">.travel</span>
          </span>
        </Link>

        <div className="max-w-md">
          {panelKicker && (
            <p className="t-mono text-[0.6875rem] tracking-[0.24em] uppercase text-paper/65 mb-4">
              {panelKicker}
            </p>
          )}
          <h2 className="h-display text-paper leading-[1.1] mb-4">
            {panelTitle}
          </h2>
          <p className="text-body-lg text-paper/72 leading-relaxed">
            {panelSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-6 t-mono text-[0.625rem] tracking-[0.18em] uppercase text-paper/55">
          <span>EST. 2024</span>
          <span aria-hidden className="h-px flex-1 bg-paper/15" />
          <span>FOR FRIENDS</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-paper text-foreground">
      {side === "left" ? panel : null}
      <div className={formClasses}>
        <div className="paper-grain absolute inset-0 pointer-events-none" />
        <div className="relative w-full max-w-md">{children}</div>
      </div>
      {side === "right" ? panel : null}
    </div>
  );
}
