import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        brass: "border-transparent bg-primary/10 text-primary",
        ink: "border-transparent bg-foreground/[0.08] text-foreground",
        success: "border-transparent bg-success/10 text-success",
        warning: "border-transparent bg-warning/15 text-foreground",
        city: "border-transparent bg-[var(--pillar-city-wash)] text-[var(--pillar-city)]",
        nature: "border-transparent bg-[var(--pillar-nature-wash)] text-[var(--pillar-nature)]",
        coastal: "border-transparent bg-[var(--pillar-coastal-wash)] text-[var(--pillar-coastal)]",
        desert: "border-transparent bg-[var(--pillar-desert-wash)] text-[var(--pillar-desert)]",
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
