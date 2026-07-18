"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UsuariosColumnVisibilityMenu } from "@/components/usuarios/usuarios-column-visibility-menu";

interface UsuariosFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void;
}

export function UsuariosFilterBar({ search, onSearchChange, columnVisibility, onColumnVisibilityChange }: UsuariosFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          className="pl-9"
          placeholder="Buscar usuario por nombre..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <UsuariosColumnVisibilityMenu visibility={columnVisibility} onChange={onColumnVisibilityChange} />
    </div>
  );
}
