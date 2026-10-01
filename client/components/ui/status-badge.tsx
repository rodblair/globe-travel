import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusTone = "success" | "warning" | "error" | "info" | "pending"

const toneClassName: Record<StatusTone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/15 text-foreground",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-info/30 bg-info/10 text-info",
  pending: "border-border bg-muted text-muted-foreground",
}

type StatusBadgeProps = React.ComponentProps<typeof Badge> & {
  tone?: StatusTone
}

function StatusBadge({
  tone = "pending",
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(toneClassName[tone], className)}
      {...props}
    />
  )
}

export { StatusBadge, type StatusTone }
