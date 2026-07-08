"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ColumnVisibilityMenu } from "@/components/students/column-visibility-menu";

interface StudentsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  universidad: string;
  onUniversidadChange: (value: string) => void;
  universidadOptions: string[];
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void;
}

export function StudentsFilterBar({
  search,
  onSearchChange,
  universidad,
  onUniversidadChange,
  universidadOptions,
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
        <div className="sm:w-56">
          <Select value={universidad} onChange={(event) => onUniversidadChange(event.target.value)}>
            <option value="">Todas las universidades</option>
            {universidadOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <ColumnVisibilityMenu visibility={columnVisibility} onChange={onColumnVisibilityChange} />
    </div>
  );
}
