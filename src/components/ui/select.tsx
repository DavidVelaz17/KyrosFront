import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "h-10 w-full appearance-none rounded-lg border border-zinc-300 bg-white pl-3 pr-9 text-sm text-zinc-900",
            "focus:border-indigo-500 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-indigo-200",
            "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400",
            "dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
      </div>
    );
  }
);
Select.displayName = "Select";
