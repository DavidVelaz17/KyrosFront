"use client";

import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import type { LogEntry } from "@/lib/types/log";
import type { RolUsuario } from "@/lib/types/auth";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils/format";

const ROL_TONE: Record<RolUsuario, "indigo" | "green" | "amber" | "neutral"> = {
  ADMIN: "indigo",
  COORDINADOR: "green",
  SECRETARIO: "amber",
  PROFESOR: "neutral",
};

const localeTextSort: SortingFn<LogEntry> = (rowA, rowB, columnId) =>
  String(rowA.getValue(columnId)).localeCompare(String(rowB.getValue(columnId)), "es", { sensitivity: "base" });

export function buildLogColumns(): ColumnDef<LogEntry>[] {
  return [
    {
      id: "timeStamp",
      header: "FECHA Y HORA",
      accessorKey: "timeStamp",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{formatDateTime(getValue<string>())}</span>
      ),
    },
    {
      id: "nombreUsuario",
      header: "USUARIO",
      accessorKey: "nombreUsuario",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => <span className="font-medium text-zinc-900 dark:text-zinc-100">{getValue<string>()}</span>,
    },
    {
      id: "usuario",
      header: "LOGIN",
      accessorKey: "usuario",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => <span className="font-mono text-xs text-zinc-500">{getValue<string>()}</span>,
    },
    {
      id: "rol",
      header: "ROL",
      accessorKey: "rol",
      enableSorting: true,
      sortingFn: localeTextSort,
      cell: ({ getValue }) => {
        const rol = getValue<RolUsuario>();
        return <Badge tone={ROL_TONE[rol]}>{rol}</Badge>;
      },
    },
  ];
}
