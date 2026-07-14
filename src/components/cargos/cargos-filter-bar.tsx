"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CargosColumnVisibilityMenu } from "@/components/cargos/cargos-column-visibility-menu";
import type { Group } from "@/lib/types/group";
import { INGRESO_A_OPTIONS } from "@/lib/types/student";

interface CargosFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  grupoId: string;
  onGrupoIdChange: (value: string) => void;
  groups: Group[];
  ingresoA: string;
  onIngresoAChange: (value: string) => void;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void;
}

export function CargosFilterBar({
  search,
  onSearchChange,
  grupoId,
  onGrupoIdChange,
  groups,
  ingresoA,
  onIngresoAChange,
  columnVisibility,
  onColumnVisibilityChange,
}: CargosFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por alumno o matrícula..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <div className="sm:w-52">
          <Select value={grupoId} onChange={(event) => onGrupoIdChange(event.target.value)}>
            <option value="">Todos los grupos</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:w-52">
          <Select value={ingresoA} onChange={(event) => onIngresoAChange(event.target.value)}>
            <option value="">Todos (Ingresa a)</option>
            {INGRESO_A_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <CargosColumnVisibilityMenu visibility={columnVisibility} onChange={onColumnVisibilityChange} />
    </div>
  );
}
