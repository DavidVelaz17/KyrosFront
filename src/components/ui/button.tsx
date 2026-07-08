import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const VARIANT_CLASSES = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-300",
  secondary:
    "bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-50 disabled:text-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-zinc-100 disabled:text-zinc-400 dark:text-zinc-300 dark:hover:bg-zinc-800",
  danger: "bg-red-600 text-white hover:bg-red-500 disabled:bg-red-300",
} as const;

const SIZE_CLASSES = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANT_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
