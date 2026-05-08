import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-medium tracking-[0.04em] uppercase whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "border-rule bg-[var(--paper-recessed)] text-foreground",
        outline: "border-rule bg-transparent text-foreground",
        brass:
          "border-transparent bg-[var(--brass-subtle)] text-[var(--brass)]",
        ink: "border-transparent bg-foreground/[0.08] text-foreground",
        city: "border-[color:var(--pillar-city-wash)] bg-[var(--pillar-city-wash)] text-[var(--pillar-city)]",
        nature:
          "border-[color:var(--pillar-nature-wash)] bg-[var(--pillar-nature-wash)] text-[var(--pillar-nature)]",
        coastal:
          "border-[color:var(--pillar-coastal-wash)] bg-[var(--pillar-coastal-wash)] text-[var(--pillar-coastal)]",
        desert:
          "border-[color:var(--pillar-desert-wash)] bg-[var(--pillar-desert-wash)] text-[var(--pillar-desert)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
