"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { EgresosColumnVisibilityMenu } from "@/components/egresos/egresos-column-visibility-menu";
import type { DestinoOption } from "@/lib/api/destinos";
import { cn } from "@/lib/utils/cn";

interface EgresosFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** "" = todos los tipos. */
  tipoId: string;
  onTipoIdChange: (value: string) => void;
  tipos: DestinoOption[];
  /** "" = todos los planteles. */
  plantelId: string;
  onPlantelIdChange: (value: string) => void;
  planteles: DestinoOption[];
  /** Cuántos egresos hay de cada tipo (por id), para mostrarlo en su botón. */
  countByTipo: Record<string, number>;
  totalCount: number;
  showEliminados: boolean;
  onShowEliminadosChange: (value: boolean) => void;
  eliminadosCount: number;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void;
}

function TipoFilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-9 rounded-full border px-3.5 text-sm font-medium transition-colors",
        active
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      )}
    >
      {label}
    </button>
  );
}

export function EgresosFilterBar({
  search,
  onSearchChange,
  tipoId,
  onTipoIdChange,
  tipos,
  plantelId,
  onPlantelIdChange,
  planteles,
  countByTipo,
  totalCount,
  showEliminados,
  onShowEliminadosChange,
  eliminadosCount,
  columnVisibility,
  onColumnVisibilityChange,
}: EgresosFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            className="pl-9"
            placeholder="Buscar en observaciones..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Buscar en observaciones"
          />
        </div>
        <div role="group" aria-label="Filtrar por tipo de egreso" className="flex flex-wrap gap-1.5">
          <TipoFilterButton label={`Todos · ${totalCount}`} active={tipoId === ""} onClick={() => onTipoIdChange("")} />
          {tipos.map((tipo) => (
            <TipoFilterButton
              key={tipo.id}
              label={`${tipo.label} · ${countByTipo[tipo.id] ?? 0}`}
              active={tipoId === tipo.id}
              onClick={() => onTipoIdChange(tipo.id)}
            />
          ))}
        </div>
        <Select
          value={plantelId}
          onChange={(event) => onPlantelIdChange(event.target.value)}
          className="h-9 w-auto"
          aria-label="Filtrar por plantel"
        >
          <option value="">Todos los planteles</option>
          {planteles.map((plantel) => (
            <option key={plantel.id} value={plantel.id}>
              {plantel.label}
            </option>
          ))}
        </Select>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
          <Checkbox checked={showEliminados} onChange={(event) => onShowEliminadosChange(event.target.checked)} />
          Mostrar eliminados ({eliminadosCount})
        </label>
      </div>
      <EgresosColumnVisibilityMenu visibility={columnVisibility} onChange={onColumnVisibilityChange} />
    </div>
  );
}
