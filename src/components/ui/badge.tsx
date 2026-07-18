import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const TONE_CLASSES = {
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  // Versiones más vívidas de amber/red (fondo sólido en vez del pastel de "amber"/no existía un
  // tono rojo) para estatus que de verdad necesitan llamar la atención: cargo/pago Parcial y
  // Vencido. Deliberadamente separados de "amber" para no oscurecer usos genéricos de esa
  // (ej. "requiere factura", alumno "Baja"), que se quedan con el tono suave.
  "amber-bold": "bg-amber-400 text-amber-950 dark:bg-amber-500 dark:text-amber-950",
  red: "bg-red-500 text-white dark:bg-red-500 dark:text-white",
} as const;

export function Badge({
  tone = "neutral",
  title,
  children,
}: {
  tone?: keyof typeof TONE_CLASSES;
  /** Tooltip nativo (ej. describir qué significa un estatus, para evitar malentendidos). */
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", TONE_CLASSES[tone])}
    >
      {children}
    </span>
  );
}
