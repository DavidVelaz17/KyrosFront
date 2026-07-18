"use client";

import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { DestinoOption } from "@/lib/api/destinos";

interface CatalogListProps {
  items: DestinoOption[];
  loading: boolean;
  emptyLabel: string;
  onEdit: (item: DestinoOption) => void;
  onDelete: (item: DestinoOption) => void;
  /** Contenido extra por fila, antes de los botones de editar/borrar (ej. el botón "Carreras" de Universidades). */
  renderExtra?: (item: DestinoOption) => ReactNode;
}

/** Lista compacta con scroll propio: varios catálogos caben en la misma pantalla sin que la
 *  página crezca sin control cuando un catálogo tiene muchos registros. */
export function CatalogList({ items, loading, emptyLabel, onEdit, onDelete, renderExtra }: CatalogListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">{emptyLabel}</p>;
  }

  return (
    <ul className="max-h-72 divide-y divide-zinc-100 overflow-y-auto rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
          <span className="truncate text-zinc-800 dark:text-zinc-200">{item.label}</span>
          <div className="flex shrink-0 items-center gap-1">
            {renderExtra?.(item)}
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 px-0" onClick={() => onEdit(item)} aria-label={`Editar ${item.label}`}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 px-0 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => onDelete(item)}
              aria-label={`Eliminar ${item.label}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
