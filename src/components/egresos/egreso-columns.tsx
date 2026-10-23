"use client";

import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import type { Egreso } from "@/lib/types/egreso";
import type { DestinoOption } from "@/lib/api/destinos";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatLocalDateTime } from "@/lib/utils/format";
import { tipoEgresoTone } from "@/lib/utils/egreso";

const localeTextSort: SortingFn<Egreso> = (rowA, rowB, columnId) =>
  String(rowA.getValue(columnId)).localeCompare(String(rowB.getValue(columnId)), "es", { sensitivity: "base" });

interface BuildEgresoColumnsOptions {
  /** Catálogo de tipos, para darle a cada uno su color de Badge (ver tipoEgresoTone). */
  tipos: DestinoOption[];
}

export function buildEgresoColumns({ tipos }: BuildEgresoColumnsOptions): ColumnDef<Egreso>[] {
  return [
    {
      id: "fechaHora",
      header: "FECHA Y HORA",
      accessorKey: "fechaHora",
      enableSorting: true,
      // "2026-10-23T10:15:00": el orden de texto ya es el cronológico.
      sortingFn: "alphanumeric",
      cell: ({ getValue }) => <span className="whitespace-nowrap">{formatLocalDateTime(getValue<string>())}</span>,
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
      id: "importe",
      header: "IMPORTE",
      accessorKey: "importe",
      enableSorting: true,
      cell: ({ getValue }) => <span className="font-medium tabular-nums">{formatCurrency(getValue<number>())}</span>,
    },
    {
      id: "observaciones",
      header: "OBSERVACIONES",
      accessorKey: "observaciones",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => (
        <span className="block max-w-md truncate whitespace-normal text-zinc-700 dark:text-zinc-300">
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
  ];
}
