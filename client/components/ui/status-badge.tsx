import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusTone = "success" | "warning" | "error" | "info" | "pending"

const toneClassName: Record<StatusTone, string> = {
  success: "border-status-success/25 bg-[var(--status-success-bg)] text-status-success",
  warning: "border-status-warning/25 bg-[var(--status-warning-bg)] text-status-warning",
  error: "border-status-error/25 bg-[var(--status-error-bg)] text-status-error",
  info: "border-status-info/25 bg-[var(--status-info-bg)] text-status-info",
  pending: "border-status-pending/25 bg-[var(--status-pending-bg)] text-status-pending",
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
