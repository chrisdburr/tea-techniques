"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = ({ 
  children, 
  content, 
  width, 
  minWidth, 
  maxWidth = "360px", 
  ...props 
}: { 
  children: React.ReactNode
  content: React.ReactNode
  width?: string
  minWidth?: string
  maxWidth?: string
} & React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) => {
  const styleProps: React.CSSProperties = {}
  if (width) styleProps.width = width
  if (minWidth) styleProps.minWidth = minWidth
  if (maxWidth) styleProps.maxWidth = maxWidth

  return (
    <TooltipPrimitive.Root {...props}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content
        side="top"
        align="center"
        sideOffset={4}
        style={styleProps}
        className={cn(
          "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        )}
      >
        {content}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip, TooltipProvider }