import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const TONE_CLASSES = {
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONE_CLASSES; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", TONE_CLASSES[tone])}>
      {children}
    </span>
  );
}
