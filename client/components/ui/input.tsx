import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-rule bg-[var(--paper-recessed)]/60 px-3 py-1 text-sm text-foreground shadow-none",
        "placeholder:text-[var(--ink-4)] selection:bg-[var(--brass-subtle)] selection:text-foreground",
        "transition-[border-color,box-shadow] outline-none",
        "focus-visible:border-[var(--brass)] focus-visible:ring-2 focus-visible:ring-[var(--brass-glow)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
