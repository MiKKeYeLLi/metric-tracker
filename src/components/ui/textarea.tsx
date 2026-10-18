import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-base transition-[border-color,box-shadow] outline-none hover:border-border-strong placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/12 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/12 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
