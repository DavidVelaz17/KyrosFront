"use client";

import { useMemo, useState } from "react";
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { Teacher } from "@/lib/types/teacher";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils/cn";

const PAGE_SIZE = 20;

interface TeachersTableProps {
  data: Teacher[];
  columns: ColumnDef<Teacher>[];
}

export function TeachersTable({ data, columns }: TeachersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  // Orden por defecto: el profesor dado de alta más recientemente arriba. No hay fecha de alta
  // en el backend, así que el id (autoincremental) es la mejor referencia del orden real de creación.
  const sortedData = useMemo(() => [...data].sort((a, b) => Number(b.id) - Number(a.id)), [data]);

  const table = useReactTable({
    data: sortedData,
    columns,
    state: { sorting },
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortDirection = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                    >
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : sortDirection === "desc" ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className={cn(
                  "hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
                  index % 2 === 1 && "bg-zinc-50/50 dark:bg-zinc-900/30"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-zinc-500">
                  No se encontraron profesores con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        pageIndex={table.getState().pagination.pageIndex}
        pageCount={table.getPageCount()}
        totalItems={data.length}
        pageSize={PAGE_SIZE}
        onPageChange={(pageIndex) => table.setPageIndex(pageIndex)}
      />
    </div>
  );
}
