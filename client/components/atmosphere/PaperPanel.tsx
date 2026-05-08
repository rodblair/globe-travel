import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PaperPanel — observatory-grade surface for instrument-style content.
 * Variants:
 *   plain  — card-paper rhythm, basic
 *   brass  — inset brass top edge, slightly elevated
 *   float  — for floating dialogs / overlays
 */
export function PaperPanel({
  variant = "plain",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "plain" | "brass" | "float";
}) {
  const variantClass =
    variant === "brass"
      ? "paper-panel-brass"
      : variant === "float"
        ? "paper-panel-float"
        : "paper-panel";
  return (
    <div
      data-slot="paper-panel"
      className={cn(variantClass, className)}
      {...props}
    />
  );
}
