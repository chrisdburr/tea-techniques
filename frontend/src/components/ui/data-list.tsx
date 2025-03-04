"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Root component
interface DataListRootProps extends React.HTMLAttributes<HTMLDListElement> {
  orientation?: "horizontal" | "vertical" | ResponsiveOrient
  size?: "1" | "2" | "3"
  trim?: "normal" | "start" | "end" | "both"
}

type ResponsiveOrient = {
  initial?: "horizontal" | "vertical"
  sm?: "horizontal" | "vertical"
  md?: "horizontal" | "vertical"
  lg?: "horizontal" | "vertical"
  xl?: "horizontal" | "vertical"
}

const DataList = React.forwardRef<HTMLDListElement, DataListRootProps>(
  ({ className, orientation = "horizontal", size = "2", children, ...props }, ref) => {
    const isVertical = typeof orientation === "string" 
      ? orientation === "vertical" 
      : orientation.initial === "vertical"
    
    const sizeClass = {
      "1": "text-xs",
      "2": "text-sm",
      "3": "text-base"
    }[size]
    
    return (
      <dl
        ref={ref}
        className={cn(
          "space-y-3", 
          sizeClass,
          isVertical ? "flex flex-col gap-3" : "grid grid-cols-[max-content_1fr] gap-x-4 gap-y-3",
          className
        )}
        {...props}
      >
        {children}
      </dl>
    )
  }
)
DataList.displayName = "DataList.Root"

// Item component 
interface DataListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "center" | "start" | "end" | "baseline" | "stretch"
}

const DataListItem = React.forwardRef<HTMLDivElement, DataListItemProps>(
  ({ className, align, children, ...props }, ref) => {
    const alignClass = align ? `items-${align}` : ""
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap",
          alignClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DataListItem.displayName = "DataList.Item"

// Label component
interface DataListLabelProps extends React.HTMLAttributes<HTMLElement> {
  width?: string
  minWidth?: string
  maxWidth?: string
  color?: string
  highContrast?: boolean
}

const DataListLabel = React.forwardRef<HTMLElement, DataListLabelProps>(
  ({ className, width, minWidth, maxWidth, color, highContrast, children, ...props }, ref) => {
    const styleProps: React.CSSProperties = {}
    if (width) styleProps.width = width
    if (minWidth) styleProps.minWidth = minWidth
    if (maxWidth) styleProps.maxWidth = maxWidth
    
    let colorClass = ""
    if (color) {
      colorClass = `text-${color}-${highContrast ? '900' : '500'}`
    }
    
    return (
      <dt
        ref={ref}
        className={cn(
          "font-medium text-muted-foreground mb-1",
          colorClass,
          className
        )}
        style={styleProps}
        {...props}
      >
        {children}
      </dt>
    )
  }
)
DataListLabel.displayName = "DataList.Label"

// Value component
const DataListValue = React.forwardRef<
  HTMLElement, 
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => {
  return (
    <dd
      ref={ref}
      className={cn("text-foreground", className)}
      {...props}
    >
      {children}
    </dd>
  )
})
DataListValue.displayName = "DataList.Value"

// Section component
interface DataListSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: string | React.ReactNode
}

const DataListSection = React.forwardRef<HTMLDivElement, DataListSectionProps>(
  ({ className, heading, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        {heading && (
          <h3 className="font-semibold text-sm">{heading}</h3>
        )}
        <div className="space-y-2">
          {children}
        </div>
      </div>
    )
  }
)
DataListSection.displayName = "DataList.Section"

export { 
  DataList, 
  DataListItem, 
  DataListLabel, 
  DataListValue, 
  DataListSection 
}