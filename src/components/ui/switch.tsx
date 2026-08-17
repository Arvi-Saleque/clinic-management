"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background",
          checked ? "bg-primary" : "bg-muted-foreground/30 dark:bg-muted-foreground/20",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange(e.target.checked)}
          {...props}
        />
        <span
          className={cn(
            "pointer-events-none block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform dark:bg-foreground",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </label>
    );
  },
);

Switch.displayName = "Switch";
