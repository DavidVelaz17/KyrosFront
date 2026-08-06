"use client";

import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import type { CargoDto } from "@/lib/api/cargos";
import { INGRESO_A_FROM_BACKEND } from "@/lib/types/student";
import type { EstatusCargo } from "@/lib/types/payment";
import { ESTATUS_CARGO_DESCRIPTIONS, TIPO_MENSUALIDAD_FROM_BACKEND } from "@/lib/types/payment";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { cargoBadgeTone, displayEstatusCargo } from "@/lib/utils/cargo";

function alumnoNombre(cargo: CargoDto): string {
  return `${cargo.estudiante.nombre} ${cargo.estudiante.apellidoPaterno} ${cargo.estudiante.apellidoMaterno}`;
}

const localeTextSort: SortingFn<CargoDto> = (rowA, rowB, columnId) =>
  String(rowA.getValue(columnId)).localeCompare(String(rowB.getValue(columnId)), "es", { sensitivity: "base" });

interface BuildCargoColumnsOptions {
  /** Solo ADMIN puede borrar cargos: sin esto (o sin onDelete) la columna de acciones no se
   *  agrega, igual que el resto de acciones exclusivas de ADMIN en la app (ver buildPagoColumns). */
  isAdmin?: boolean;
  onDelete?: (cargo: CargoDto) => void;
}

export function buildCargoColumns({ isAdmin, onDelete }: BuildCargoColumnsOptions = {}): ColumnDef<CargoDto>[] {
  const columns: ColumnDef<CargoDto>[] = [
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
      accessorFn: (row) => displayEstatusCargo(row.estatusCargo as EstatusCargo, row.fechaVencimientoCargo),
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ row }) => {
        const estatus = displayEstatusCargo(row.original.estatusCargo as EstatusCargo, row.original.fechaVencimientoCargo);
        return (
          <Badge
            tone={cargoBadgeTone(row.original.estatusCargo as EstatusCargo, row.original.fechaVencimientoCargo)}
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
      accessorFn: (row) =>
        row.estudiante.ingresoA
          ? (INGRESO_A_FROM_BACKEND[row.estudiante.ingresoA] ?? row.estudiante.ingresoA)
          : "Sin especificar",
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

  if (isAdmin && onDelete) {
    columns.push({
      id: "acciones",
      header: "ACCIONES",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onDelete(row.original)}
          className="inline-flex items-center gap-1 rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          title="Eliminar cargo"
          aria-label="Eliminar cargo"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    });
  }

  return columns;
}
