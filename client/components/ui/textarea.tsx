import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-md border border-rule bg-[var(--paper-recessed)]/60 px-3 py-2 text-sm text-foreground shadow-none",
        "placeholder:text-[var(--ink-4)]",
        "transition-[border-color,box-shadow] outline-none",
        "focus-visible:border-[var(--brass)] focus-visible:ring-2 focus-visible:ring-[var(--brass-glow)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "resize-y",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
