"use client";

import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import { Eye, KeyRound, Pencil } from "lucide-react";
import type { Teacher } from "@/lib/types/teacher";

const localeTextSort: SortingFn<Teacher> = (rowA, rowB, columnId) =>
  String(rowA.getValue(columnId)).localeCompare(String(rowB.getValue(columnId)), "es", { sensitivity: "base" });

interface BuildColumnsArgs {
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onResetPassword: (teacher: Teacher) => void;
}

export function buildTeacherColumns({ onView, onEdit, onResetPassword }: BuildColumnsArgs): ColumnDef<Teacher>[] {
  return [
    {
      id: "usuario",
      header: "USUARIO",
      accessorKey: "usuario",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{getValue<string>()}</span>,
    },
    {
      id: "nombreUsuario",
      header: "NOMBRE",
      accessorKey: "nombreUsuario",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => <span className="font-medium text-zinc-900 dark:text-zinc-100">{getValue<string>()}</span>,
    },
    {
      id: "direccionUsuario",
      header: "DIRECCIÓN",
      accessorKey: "direccionUsuario",
      enableSorting: false,
      cell: ({ getValue }) => <span className="line-clamp-1 max-w-72">{getValue<string>()}</span>,
    },
    {
      id: "acciones",
      header: "ACCIONES",
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
            onClick={() => onEdit(row.original)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Modificar"
            aria-label="Modificar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onResetPassword(row.original)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Modificar contraseña"
            aria-label="Modificar contraseña"
          >
            <KeyRound className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];
}
