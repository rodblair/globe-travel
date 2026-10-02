import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-xl border-2 border-input bg-card px-4 py-3 text-base md:text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "transition-[border-color,box-shadow] outline-none",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
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
