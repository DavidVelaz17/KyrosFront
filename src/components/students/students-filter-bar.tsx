"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ColumnVisibilityMenu } from "@/components/students/column-visibility-menu";
import { StudentsFilterPanel } from "@/components/students/students-filter-panel";
import type { StudentFilters } from "@/lib/types/student-filters";

interface GroupOption {
  id: string;
  nombre: string;
}

interface StudentsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: StudentFilters;
  onFiltersChange: (patch: Partial<StudentFilters>) => void;
  onClearFilters: () => void;
  universidadOptions: string[];
  groupOptions?: GroupOption[];
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void;
}

export function StudentsFilterBar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearFilters,
  universidadOptions,
  groupOptions,
  columnVisibility,
  onColumnVisibilityChange,
}: StudentsFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            className="pl-9"
            placeholder="Buscar alumno por nombre..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <StudentsFilterPanel
          filters={filters}
          onChange={onFiltersChange}
          onClear={onClearFilters}
          universidadOptions={universidadOptions}
          groupOptions={groupOptions}
        />
      </div>
      <ColumnVisibilityMenu visibility={columnVisibility} onChange={onColumnVisibilityChange} />
    </div>
  );
}
