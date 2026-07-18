"use client";

import { cn } from "@/lib/utils/cn";

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

/** Fila compacta de pestañas: solo el panel activo se renderiza, así varios catálogos chicos
 *  caben en la misma pantalla sin apilarse uno debajo del otro. */
export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex flex-wrap gap-1 border-b border-zinc-200 dark:border-zinc-800", className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "-mb-px rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            active === tab.id
              ? "border-indigo-600 text-indigo-700 dark:border-indigo-500 dark:text-indigo-300"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
