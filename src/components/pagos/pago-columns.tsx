"use client";

import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import { Printer } from "lucide-react";
import type { Payment } from "@/lib/types/payment";
import { ESTATUS_CARGO_DESCRIPTIONS } from "@/lib/types/payment";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { cargoBadgeTone, displayEstatusCargo } from "@/lib/utils/cargo";

const localeTextSort: SortingFn<Payment> = (rowA, rowB, columnId) =>
  String(rowA.getValue(columnId)).localeCompare(String(rowB.getValue(columnId)), "es", { sensitivity: "base" });

export function buildPagoColumns(): ColumnDef<Payment>[] {
  return [
    {
      id: "fecha",
      header: "FECHA",
      accessorKey: "fecha",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      id: "alumno",
      header: "ALUMNO",
      accessorKey: "studentNombre",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => <span className="font-medium text-zinc-900 dark:text-zinc-100">{getValue<string>()}</span>,
    },
    {
      id: "grupo",
      header: "GRUPO",
      accessorKey: "grupoNombre",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => <span className="text-zinc-500">{getValue<string>()}</span>,
    },
    {
      id: "concepto",
      header: "CONCEPTO",
      accessorKey: "concepto",
      enableSorting: false,
    },
    {
      id: "monto",
      header: "MONTO",
      accessorKey: "monto",
      enableSorting: true,
      cell: ({ getValue }) => <span className="font-medium">{formatCurrency(getValue<number>())}</span>,
    },
    {
      id: "metodoPago",
      header: "MÉTODO DE PAGO",
      accessorKey: "metodoPago",
      enableSorting: false,
      cell: ({ getValue }) => <Badge>{getValue<string>()}</Badge>,
    },
    {
      id: "usuario",
      header: "USUARIO",
      accessorKey: "usuarioNombre",
      enableSorting: true,
      sortingFn: localeTextSort,
    },
    {
      id: "requiereFactura",
      header: "REQUIERE FACTURA",
      accessorKey: "requiereFactura",
      enableSorting: true,
      cell: ({ getValue }) => <Badge tone={getValue<boolean>() ? "amber" : "neutral"}>{getValue<boolean>() ? "Sí" : "No"}</Badge>,
    },
    {
      id: "tipoMensualidad",
      header: "TIPO DE MENSUALIDAD",
      accessorKey: "tipoMensualidad",
      enableSorting: false,
      cell: ({ getValue }) => <Badge tone="indigo">{getValue<string>()}</Badge>,
    },
    {
      id: "estatusCargo",
      header: "ESTATUS DEL CARGO",
      accessorKey: "estatusCargo",
      enableSorting: false,
      cell: ({ row }) => {
        const estatus = displayEstatusCargo(row.original.estatusCargo, row.original.fechaVencimientoCargo);
        return (
          <Badge
            tone={cargoBadgeTone(row.original.estatusCargo, row.original.fechaVencimientoCargo)}
            title={ESTATUS_CARGO_DESCRIPTIONS[estatus]}
          >
            {estatus}
          </Badge>
        );
      },
    },
    {
      id: "acciones",
      header: "ACCIONES",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <a
          href={`/reportes/recibo?paymentId=${row.original.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          title="Imprimir recibo"
          aria-label="Imprimir recibo"
        >
          <Printer className="h-4 w-4" />
        </a>
      ),
    },
  ];
}
