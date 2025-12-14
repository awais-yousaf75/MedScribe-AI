import * as React from "react";
import { cn } from "./utils"; // adjust path if your utils is elsewhere

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const DropStyle = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      data-slot="select"
      className={cn(
        // Base: copied/adapted from your Input styles
        "bg-input-background text-foreground placeholder:text-muted-foreground border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Focus & error states
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  ),
);

DropStyle.displayName = "DropStyle";

export { DropStyle };