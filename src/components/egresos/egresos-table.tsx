"use client";

import { useState } from "react";
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import type { ColumnDef, SortingState, VisibilityState } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { Egreso } from "@/lib/types/egreso";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";

const PAGE_SIZE = 20;

interface EgresosTableProps {
  data: Egreso[];
  columns: ColumnDef<Egreso>[];
  columnVisibility: VisibilityState;
  /** Suma de los egresos filtrados, mostrada en la fila final bajo la columna Importe. */
  total: number;
}

export function EgresosTable({ data, columns, columnVisibility, total }: EgresosTableProps) {
  // Orden por defecto: el egreso más reciente arriba (por su fecha y hora, que es lo que el usuario
  // captura y puede ser anterior al momento en que se registró).
  const [sorting, setSorting] = useState<SortingState>([{ id: "fechaHora", desc: true }]);

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility, sorting },
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const visibleColumns = table.getVisibleLeafColumns();

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
                      className={cn(
                        "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400",
                        header.column.id === "importe" && "text-right"
                      )}
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
                  <td
                    key={cell.id}
                    className={cn("px-4 py-3 align-middle", cell.column.id === "importe" && "whitespace-nowrap text-right")}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length} className="px-4 py-10 text-center text-sm text-zinc-500">
                  No se encontraron egresos con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
              <tr>
                {visibleColumns.map((column, index) => (
                  <td
                    key={column.id}
                    className={cn(
                      "px-4 py-3",
                      column.id === "importe" && "whitespace-nowrap text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-100"
                    )}
                  >
                    {column.id === "importe" ? (
                      formatCurrency(total)
                    ) : index === 0 ? (
                      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                        Total del filtro
                      </span>
                    ) : null}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
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
