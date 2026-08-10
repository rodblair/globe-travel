import * as React from "react"
import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type EmptyStateProps = React.ComponentProps<"div"> & {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-start rounded-lg border border-dashed border-rule bg-paper-raised/60 p-6 text-left",
        className,
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-paper-recessed text-muted-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export { EmptyState }
