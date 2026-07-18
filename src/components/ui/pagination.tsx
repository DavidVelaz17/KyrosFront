"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  pageIndex: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (pageIndex: number) => void;
}

export function Pagination({ pageIndex, pageCount, totalItems, pageSize, onPageChange }: PaginationProps) {
  if (totalItems === 0) return null;

  const firstItem = pageIndex * pageSize + 1;
  const lastItem = Math.min(totalItems, (pageIndex + 1) * pageSize);

  return (
    <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Mostrando <span className="font-medium text-zinc-700 dark:text-zinc-200">{firstItem}-{lastItem}</span> de{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-200">{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex === 0}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-zinc-600 dark:text-zinc-300">
          Página {pageIndex + 1} de {Math.max(pageCount, 1)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
