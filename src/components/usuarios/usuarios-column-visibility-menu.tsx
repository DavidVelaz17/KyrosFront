"use client";

import { Columns3 } from "lucide-react";
import { PopoverMenu } from "@/components/ui/popover-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { USUARIO_COLUMN_CATALOG } from "@/lib/constants/usuario-columns";

interface UsuariosColumnVisibilityMenuProps {
  visibility: Record<string, boolean>;
  onChange: (visibility: Record<string, boolean>) => void;
}

export function UsuariosColumnVisibilityMenu({ visibility, onChange }: UsuariosColumnVisibilityMenuProps) {
  function toggle(columnId: string) {
    onChange({ ...visibility, [columnId]: !visibility[columnId] });
  }

  return (
    <PopoverMenu
      align="right"
      closeOnSelect={false}
      trigger={() => (
        <Button variant="secondary" size="sm">
          <Columns3 className="h-4 w-4" />
          Columnas
        </Button>
      )}
    >
      <div className="max-h-80 overflow-y-auto px-1 py-1">
        <p className="px-2 py-1 text-xs font-medium uppercase text-zinc-400">Mostrar columnas</p>
        {USUARIO_COLUMN_CATALOG.map((column) => (
          <label
            key={column.id}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Checkbox checked={visibility[column.id] ?? column.defaultVisible} onChange={() => toggle(column.id)} />
            {column.label}
          </label>
        ))}
      </div>
    </PopoverMenu>
  );
}
