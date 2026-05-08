import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Atmosphere button variants.
 *
 * default  — brass-on-paper, the wayfinding CTA
 * action   — ink-filled, routine confirms (Save, Apply)
 * outline  — hairline ink rule on paper
 * ghost    — quiet, paper-hover lift
 * link     — brass with underline on hover
 * destructive — terracotta, used sparingly
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-[var(--brass-hover)] active:scale-[0.99]",
        action:
          "bg-[var(--action)] text-[var(--action-foreground)] shadow-xs hover:bg-[var(--action-hover)] active:scale-[0.99]",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90",
        outline:
          "border border-rule bg-transparent hover:bg-[var(--paper-hover)] text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[var(--paper-sumi)]",
        ghost:
          "bg-transparent text-foreground hover:bg-[var(--paper-hover)]",
        link:
          "text-primary underline-offset-4 hover:underline hover:text-[var(--brass-hover)] p-0 h-auto",
      },
      size: {
        default: "h-9 px-4 py-2 text-sm has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 text-[0.8125rem] has-[>svg]:px-2.5",
        lg: "h-11 rounded-md px-6 text-[0.9375rem] has-[>svg]:px-4",
        xl: "h-12 rounded-md px-7 text-base has-[>svg]:px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
