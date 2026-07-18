"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PagosColumnVisibilityMenu } from "@/components/pagos/pagos-column-visibility-menu";
import type { Group } from "@/lib/types/group";

interface PagosFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  grupoId: string;
  onGrupoIdChange: (value: string) => void;
  groups: Group[];
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void;
}

export function PagosFilterBar({
  search,
  onSearchChange,
  grupoId,
  onGrupoIdChange,
  groups,
  columnVisibility,
  onColumnVisibilityChange,
}: PagosFilterBarProps) {
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
          <Select value={grupoId} onChange={(event) => onGrupoIdChange(event.target.value)}>
            <option value="">Todos los grupos</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <PagosColumnVisibilityMenu visibility={columnVisibility} onChange={onColumnVisibilityChange} />
    </div>
  );
}
