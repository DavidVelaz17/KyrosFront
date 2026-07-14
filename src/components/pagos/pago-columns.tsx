"use client";

import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import type { EstatusCargo, Payment } from "@/lib/types/payment";
import { ESTATUS_CARGO_DESCRIPTIONS } from "@/lib/types/payment";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";

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
      cell: ({ getValue }) => {
        const estatus = getValue<EstatusCargo>();
        return (
          <Badge
            tone={estatus === "PAGADO" ? "green" : estatus === "PARCIAL" ? "amber" : "neutral"}
            title={ESTATUS_CARGO_DESCRIPTIONS[estatus]}
          >
            {estatus}
          </Badge>
        );
      },
    },
  ];
}
