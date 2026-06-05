"use client";

import * as React from "react";
import Link from "next/link";
import { ContourOverlay } from "./ContourOverlay";
import { GlobeBrand } from "./GlobeBrand";

/**
 * Two-column auth canvas. Shared by login / signup / reset.
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
    <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden border-r border-rule bg-[var(--paper-recessed)] text-foreground">
      {/* atmospheric gradient */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, color-mix(in oklch, var(--brass), transparent 82%) 0%, transparent 34%), linear-gradient(160deg, var(--paper-raised) 0%, var(--paper-recessed) 58%, var(--paper-sumi) 100%)",
        }}
      />
      {/* contour band */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 opacity-50">
        <ContourOverlay density="normal" className="text-ink-3" />
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
        <Link href="/" className="inline-flex min-h-11 items-center group">
          <GlobeBrand compact />
        </Link>

        <div className="max-w-md">
          {panelKicker && (
            <p className="t-mono text-[0.6875rem] tracking-[0.24em] uppercase text-ink-3 mb-4">
              {panelKicker}
            </p>
          )}
          <p className="h-display text-foreground leading-[1.1] mb-4">
            {panelTitle}
          </p>
          <p className="text-body-lg text-ink-2 leading-relaxed">
            {panelSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-6 t-mono text-[0.625rem] tracking-[0.18em] uppercase text-ink-3">
          <span>EST. 2024</span>
          <span aria-hidden className="h-px flex-1 bg-rule" />
          <span>FOR FRIENDS</span>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen flex bg-paper text-foreground" aria-label="Authentication">
      {side === "left" ? panel : null}
      <div className={formClasses}>
        <div className="paper-grain absolute inset-0 pointer-events-none" />
        <div className="relative w-full max-w-md">{children}</div>
      </div>
      {side === "right" ? panel : null}
    </main>
  );
}
