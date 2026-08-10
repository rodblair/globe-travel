"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"

import { IconButton } from "@/components/ui/icon-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ActionMenuProps = {
  label?: string
  align?: React.ComponentProps<typeof DropdownMenuContent>["align"]
  children: React.ReactNode
}

function ActionMenu({
  label = "More actions",
  align = "end",
  children,
}: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton label={label} variant="ghost" size="icon-sm">
          <MoreHorizontal className="size-4" />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ActionMenu }
