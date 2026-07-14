"use client";

import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import type { CargoDto } from "@/lib/api/cargos";
import { INGRESO_A_FROM_BACKEND } from "@/lib/types/student";
import type { EstatusCargo } from "@/lib/types/payment";
import { ESTATUS_CARGO_DESCRIPTIONS, TIPO_MENSUALIDAD_FROM_BACKEND } from "@/lib/types/payment";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";

function alumnoNombre(cargo: CargoDto): string {
  return `${cargo.estudiante.nombre} ${cargo.estudiante.apellidoPaterno} ${cargo.estudiante.apellidoMaterno}`;
}

const localeTextSort: SortingFn<CargoDto> = (rowA, rowB, columnId) =>
  String(rowA.getValue(columnId)).localeCompare(String(rowB.getValue(columnId)), "es", { sensitivity: "base" });

export function buildCargoColumns(): ColumnDef<CargoDto>[] {
  return [
    {
      id: "alumno",
      header: "ALUMNO",
      accessorFn: (row) => alumnoNombre(row),
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ row }) => <span className="font-medium text-zinc-900 dark:text-zinc-100">{alumnoNombre(row.original)}</span>,
    },
    {
      id: "matricula",
      header: "MATRÍCULA",
      accessorFn: (row) => row.estudiante.matricula,
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{getValue<string>()}</span>,
    },
    {
      id: "grupo",
      header: "GRUPO",
      accessorFn: (row) => row.estudiante.grupo?.nombreGrupo ?? "Sin grupo",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => <span className="text-zinc-500">{getValue<string>()}</span>,
    },
    {
      id: "concepto",
      header: "CONCEPTO",
      accessorFn: (row) => row.conceptoCargo || "(sin concepto)",
      enableSorting: false,
    },
    {
      id: "montoTotal",
      header: "MONTO TOTAL",
      accessorKey: "montoTotalCargo",
      enableSorting: true,
      cell: ({ getValue }) => <span className="font-medium">{formatCurrency(getValue<number>())}</span>,
    },
    {
      id: "fechaVencimiento",
      header: "FECHA DE VENCIMIENTO",
      accessorKey: "fechaVencimientoCargo",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      id: "estatus",
      header: "ESTATUS",
      accessorKey: "estatusCargo",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => {
        const estatus = getValue<EstatusCargo>();
        return (
          <Badge
            tone={estatus === "PAGADO" ? "green" : estatus === "PARCIAL" ? "amber" : estatus === "VENCIDO" ? "amber" : "neutral"}
            title={ESTATUS_CARGO_DESCRIPTIONS[estatus]}
          >
            {estatus}
          </Badge>
        );
      },
    },
    {
      id: "ingresoA",
      header: "INGRESO A",
      accessorFn: (row) => INGRESO_A_FROM_BACKEND[row.estudiante.ingresoA] ?? row.estudiante.ingresoA,
      enableSorting: false,
      cell: ({ getValue }) => <Badge tone="indigo">{getValue<string>()}</Badge>,
    },
    {
      id: "tipoMensualidad",
      header: "TIPO DE MENSUALIDAD",
      accessorFn: (row) => TIPO_MENSUALIDAD_FROM_BACKEND[row.tipoMensualidadCargo] ?? row.tipoMensualidadCargo,
      enableSorting: false,
    },
    {
      id: "usuario",
      header: "USUARIO",
      accessorFn: (row) => row.usuario?.nombreUsuario ?? "—",
      enableSorting: true,
      sortingFn: localeTextSort,
    },
  ];
}
