import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-200",
          "dark:border-zinc-600 dark:bg-zinc-800",
          className
        )}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";
