"use client";

import * as React from "react";

type InputProps = React.ComponentProps<"input">;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "flex h-10 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60 focus-visible:border-primary",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
