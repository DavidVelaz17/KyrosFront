"use client";

import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import { Eye, History, Wallet } from "lucide-react";
import type { Student } from "@/lib/types/student";
import { studentFullName } from "@/lib/types/student";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";

/** Accent-aware alphabetical comparison so "Á" sorts next to "A" instead of after "Z". */
const localeTextSort: SortingFn<Student> = (rowA, rowB, columnId) =>
  String(rowA.getValue(columnId)).localeCompare(String(rowB.getValue(columnId)), "es", { sensitivity: "base" });

interface BuildColumnsArgs {
  /** Resuelve el nombre de grupo a mostrar para cada fila (constante en la vista de un solo
   *  grupo; depende de student.grupoId en la vista global de todos los alumnos). */
  resolveGroupName: (student: Student) => string;
  /** Universidad(es) ligada(s) al alumno (["No aplica"] si su ingresoA no es Universidad o no tiene ninguna). */
  resolveUniversidad: (student: Student) => string[];
  onView: (student: Student) => void;
  onPay: (student: Student) => void;
  onHistory: (student: Student) => void;
}

export function buildStudentColumns({
  resolveGroupName,
  resolveUniversidad,
  onView,
  onPay,
  onHistory,
}: BuildColumnsArgs): ColumnDef<Student>[] {
  return [
    {
      id: "foto",
      header: "FOTO",
      enableHiding: true,
      enableSorting: false,
      cell: ({ row }) => (
        <Avatar src={row.original.fotoUrl} label={row.original.nombre.slice(0, 2).toUpperCase()} size={32} />
      ),
    },
    {
      id: "matricula",
      header: "MATRÍCULA",
      accessorKey: "matricula",
      enableSorting: false,
      cell: ({ getValue }) => <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{getValue<string>()}</span>,
    },
    {
      id: "grupo",
      header: "GRUPO",
      accessorFn: (row) => resolveGroupName(row),
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ row }) => <span className="text-sm text-zinc-600 dark:text-zinc-400">{resolveGroupName(row.original)}</span>,
    },
    {
      id: "nombreCompleto",
      header: "NOMBRE COMPLETO",
      accessorFn: (row) => studentFullName(row),
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ row }) => <span className="font-medium text-zinc-900 dark:text-zinc-100">{studentFullName(row.original)}</span>,
    },
    {
      id: "telefono",
      header: "TELÉFONO",
      accessorKey: "telefono",
      enableSorting: false,
    },
    {
      id: "universidad",
      header: "UNIVERSIDAD",
      accessorFn: (row) => resolveUniversidad(row).join(", "),
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          {resolveUniversidad(row.original).map((nombre, index) => (
            <span key={index} className="text-sm text-zinc-600 dark:text-zinc-400">
              {nombre}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "nombre",
      header: "NOMBRE",
      accessorKey: "nombre",
      enableSorting: false,
    },
    {
      id: "apellidoPaterno",
      header: "APELLIDO PATERNO",
      accessorKey: "apellidoPaterno",
      enableSorting: false,
    },
    {
      id: "apellidoMaterno",
      header: "APELLIDO MATERNO",
      accessorKey: "apellidoMaterno",
      enableSorting: false,
    },
    {
      id: "edad",
      header: "EDAD",
      accessorKey: "edad",
      enableSorting: false,
    },
    {
      id: "ingresoA",
      header: "INGRESO A",
      accessorKey: "ingresoA",
      enableSorting: false,
      cell: ({ getValue }) => <Badge tone="indigo">{getValue<string>()}</Badge>,
    },
    {
      id: "horario",
      header: "HORARIO",
      accessorKey: "horario",
      enableSorting: false,
      cell: ({ getValue }) => <Badge>{getValue<string>()}</Badge>,
    },
    {
      id: "gradoEscolar",
      header: "GRADO ESCOLAR",
      accessorKey: "gradoEscolar",
      enableSorting: false,
    },
    {
      id: "tutorNombre",
      header: "TUTOR",
      accessorKey: "tutorNombre",
      enableSorting: false,
    },
    {
      id: "tutorTelefono",
      header: "TELÉFONO DEL TUTOR",
      accessorKey: "tutorTelefono",
      enableSorting: false,
    },
    {
      id: "direccion",
      header: "DIRECCIÓN",
      accessorKey: "direccion",
      enableSorting: false,
      cell: ({ getValue }) => <span className="line-clamp-1 max-w-56">{getValue<string>()}</span>,
    },
    {
      id: "fechaInscripcion",
      header: "FECHA DE INSCRIPCIÓN",
      accessorKey: "fechaInscripcion",
      enableSorting: false,
      cell: ({ getValue }) => formatDate(getValue<string>()),
    },
    {
      id: "notas",
      header: "NOTAS",
      accessorKey: "notas",
      enableSorting: false,
      cell: ({ getValue }) => <span className="line-clamp-1 max-w-48 text-zinc-500">{getValue<string>() || "—"}</span>,
    },
    {
      id: "acciones",
      header: "ACCIONES",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onView(row.original)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Ver información"
            aria-label="Ver información"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onPay(row.original)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Pagar"
            aria-label="Pagar"
          >
            <Wallet className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onHistory(row.original)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Historial de pagos"
            aria-label="Historial de pagos"
          >
            <History className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];
}
