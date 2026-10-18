"use client"

import * as React from "react"
import { cn } from "cn"

function Table({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"table"> & { variant?: "default" | "pill" }) {
  return (
    <div
      data-slot="table-container"
      data-variant={variant}
      className="group/table relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm data-[variant=pill]:border-separate data-[variant=pill]:border-spacing-0", className)}
        data-variant={variant}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted/70 [&_tr]:border-b [&_tr]:hover:bg-transparent group-data-[variant=pill]/table:bg-transparent group-data-[variant=pill]/table:[&_tr]:border-0", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0 group-data-[variant=pill]/table:[&_tr:last-child>td]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "group/row border-b transition-colors hover:bg-primary/4 has-aria-expanded:bg-primary/4 data-[state=selected]:bg-accent group-data-[variant=pill]/table:border-0 group-data-[variant=pill]/table:hover:bg-accent/45 group-data-[variant=pill]/table:has-aria-expanded:bg-accent/45",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-3 text-left align-middle text-2xs font-bold tracking-[0.07em] whitespace-nowrap text-muted-foreground uppercase [&:has([role=checkbox])]:pr-0",
        "group-data-[variant=pill]/table:h-[52px] group-data-[variant=pill]/table:border-b-8 group-data-[variant=pill]/table:border-transparent group-data-[variant=pill]/table:bg-accent group-data-[variant=pill]/table:bg-clip-padding group-data-[variant=pill]/table:px-2.5 group-data-[variant=pill]/table:sm:px-4 group-data-[variant=pill]/table:text-xs group-data-[variant=pill]/table:font-semibold group-data-[variant=pill]/table:tracking-[0.04em] group-data-[variant=pill]/table:text-primary-deep group-data-[variant=pill]/table:first:rounded-l-full group-data-[variant=pill]/table:last:rounded-r-full",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-2.5 align-middle text-[13px] whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        "group-data-[variant=pill]/table:h-14 group-data-[variant=pill]/table:border-b group-data-[variant=pill]/table:border-border group-data-[variant=pill]/table:px-2.5 group-data-[variant=pill]/table:sm:px-4 group-data-[variant=pill]/table:py-2 group-data-[variant=pill]/table:text-sm",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
