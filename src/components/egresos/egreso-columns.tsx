"use client";

import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import { History, Pencil, Trash2, Undo2 } from "lucide-react";
import type { Egreso } from "@/lib/types/egreso";
import type { DestinoOption } from "@/lib/api/destinos";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatLocalDateTime } from "@/lib/utils/format";
import {
  ESTATUS_EGRESO_LABELS,
  estatusEgresoTitle,
  estatusEgresoTone,
  isEgresoEliminado,
  tipoEgresoTone,
} from "@/lib/utils/egreso";

const localeTextSort: SortingFn<Egreso> = (rowA, rowB, columnId) =>
  String(rowA.getValue(columnId)).localeCompare(String(rowB.getValue(columnId)), "es", { sensitivity: "base" });

const ACTION_BUTTON_CLASS =
  "inline-flex items-center gap-1 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";

interface BuildEgresoColumnsOptions {
  /** Catálogo de tipos, para darle a cada uno su color de Badge (ver tipoEgresoTone). */
  tipos: DestinoOption[];
  onHistorial: (egreso: Egreso) => void;
  onCorregir: (egreso: Egreso) => void;
  onEliminar: (egreso: Egreso) => void;
  onRestaurar: (egreso: Egreso) => void;
}

export function buildEgresoColumns({
  tipos,
  onHistorial,
  onCorregir,
  onEliminar,
  onRestaurar,
}: BuildEgresoColumnsOptions): ColumnDef<Egreso>[] {
  return [
    {
      id: "fechaHora",
      header: "FECHA Y HORA",
      accessorKey: "fechaHora",
      enableSorting: true,
      // "2026-10-23T10:15:00": el orden de texto ya es el cronológico.
      sortingFn: "alphanumeric",
      cell: ({ row, getValue }) => (
        <span className={cn("whitespace-nowrap", isEgresoEliminado(row.original) && "line-through")}>
          {formatLocalDateTime(getValue<string>())}
        </span>
      ),
    },
    {
      id: "tipo",
      header: "TIPO DE EGRESO",
      accessorKey: "tipoNombre",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ row }) => <Badge tone={tipoEgresoTone(row.original.tipoId, tipos)}>{row.original.tipoNombre}</Badge>,
    },
    {
      id: "plantel",
      header: "PLANTEL",
      accessorKey: "plantelNombre",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ row }) =>
        row.original.plantelId ? (
          <span className="whitespace-nowrap">{row.original.plantelNombre}</span>
        ) : (
          <span className="text-zinc-400">Sin plantel</span>
        ),
    },
    {
      id: "importe",
      header: "IMPORTE",
      accessorKey: "importe",
      enableSorting: true,
      cell: ({ row, getValue }) => (
        <span className={cn("font-medium tabular-nums", isEgresoEliminado(row.original) && "line-through")}>
          {formatCurrency(getValue<number>())}
        </span>
      ),
    },
    {
      id: "observaciones",
      header: "OBSERVACIONES",
      accessorKey: "observaciones",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ row, getValue }) => (
        <span
          className={cn(
            "block max-w-md truncate whitespace-normal",
            isEgresoEliminado(row.original) ? "line-through" : "text-zinc-700 dark:text-zinc-300"
          )}
        >
          {getValue<string>() || <span className="text-zinc-400">—</span>}
        </span>
      ),
    },
    {
      id: "usuario",
      header: "REGISTRADO POR",
      accessorKey: "usuarioNombre",
      enableSorting: true,
      sortingFn: localeTextSort,
    },
    {
      id: "estatus",
      header: "ESTADO",
      accessorFn: (egreso) => ESTATUS_EGRESO_LABELS[egreso.estatus],
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ row }) => (
        <Badge tone={estatusEgresoTone(row.original.estatus)} title={estatusEgresoTitle(row.original)}>
          {ESTATUS_EGRESO_LABELS[row.original.estatus]}
        </Badge>
      ),
    },
    {
      id: "acciones",
      header: "ACCIONES",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const egreso = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onHistorial(egreso)}
              className={ACTION_BUTTON_CLASS}
              title="Ver historial"
              aria-label="Ver historial"
            >
              <History className="h-4 w-4" />
            </button>
            {isEgresoEliminado(egreso) ? (
              <button
                type="button"
                onClick={() => onRestaurar(egreso)}
                className="inline-flex items-center gap-1 rounded-md p-1.5 text-zinc-500 hover:bg-indigo-50 hover:text-indigo-700 dark:text-zinc-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
                title="Restaurar egreso"
                aria-label="Restaurar egreso"
              >
                <Undo2 className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onCorregir(egreso)}
                  className={ACTION_BUTTON_CLASS}
                  title="Corregir egreso"
                  aria-label="Corregir egreso"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onEliminar(egreso)}
                  className="inline-flex items-center gap-1 rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  title="Eliminar egreso"
                  aria-label="Eliminar egreso"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];
}
