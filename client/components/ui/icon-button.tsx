import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type IconButtonProps = React.ComponentProps<typeof Button> &
  VariantProps<typeof buttonVariants> & {
    label: string
  }

function IconButton({
  label,
  className,
  size = "icon",
  variant = "ghost",
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button
      aria-label={label}
      title={props.title ?? label}
      variant={variant}
      size={size}
      className={cn("touch-target", className)}
      {...props}
   >
      {children}
      <span className="sr-only">{label}</span>
    </Button>
  )
}

export { IconButton }
