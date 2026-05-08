"use client";

import * as React from "react";
import Image from "next/image";
import { MeridianFrame } from "./MeridianFrame";
import { cn } from "@/lib/utils";

/**
 * Photographic aperture — destination image rendered through a soft circular
 * lens vignette, with optional corner reticles. Quiet on the page; the
 * destination breathes through.
 */
export function ApertureImage({
  src,
  alt,
  className,
  reticle = true,
  vignette = "soft",
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  reticle?: boolean;
  vignette?: "soft" | "tight" | "none";
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md",
        "before:pointer-events-none before:absolute before:inset-0 before:z-[1] before:rounded-md",
        "before:shadow-[inset_0_0_0_1px_var(--rule)]",
        className,
      )}
    >
      <div
        className={cn(
          "relative h-full w-full",
          vignette === "soft" && "aperture-soft",
          vignette === "tight" && "aperture",
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
          className="object-cover"
        />
      </div>
      {reticle && (
        <MeridianFrame
          color="rgba(246,241,230,0.85)"
          opacity={0.85}
          inset={10}
          length={12}
        />
      )}
    </div>
  );
}
