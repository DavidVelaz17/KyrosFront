"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CatalogList } from "@/components/catalogos/catalog-list";
import { CatalogFormModal } from "@/components/catalogos/catalog-form-modal";
import type { DestinoOption } from "@/lib/api/destinos";
import { invalidateKeys, updateCachedList, type CatalogQuery } from "@/lib/query/queries";

const EMPTY_ITEMS: DestinoOption[] = [];

interface SimpleCatalogPanelProps {
  /** Ej. "Bachilleratos". */
  title: string;
  /** Ej. "Bachillerato" — usado en el campo del formulario y en los mensajes. */
  singularLabel: string;
  /** Ej. "Nueva universidad" / "Nuevo bachillerato" — frase completa para que el llamador
   *  resuelva la concordancia de género (el componente no puede adivinarla del nombre). */
  newLabel: string;
  /** Consulta cacheada del catálogo (ver catalogQueries): la misma que usan los formularios de
   *  alumno, así que lo que se edite aquí se refleja allá sin volver a pedirlo. */
  query: CatalogQuery;
  create: (nombre: string) => Promise<DestinoOption>;
  update: (id: string, nombre: string) => Promise<DestinoOption>;
  remove: (id: string) => Promise<void>;
  /** Contenido extra por fila (ej. el botón "Carreras" en Universidades). */
  renderExtra?: (item: DestinoOption) => ReactNode;
  /** Listas que muestran el nombre de este catálogo y deben refrescarse al editarlo. Por defecto,
   *  los destinos de las tablas de alumnos. */
  dependentKeys?: QueryKey[];
}

const DEFAULT_DEPENDENT_KEYS: QueryKey[] = [["students", "destinos"]];

/** Panel de catálogo genérico (nombre único): lista compacta + alta/edición/borrado. Reutilizado
 *  para Universidades, Bachilleratos, Secundarias, Materias, Cursos de verano y Tipos de egreso,
 *  que comparten la misma forma. */
export function SimpleCatalogPanel({
  title,
  singularLabel,
  newLabel,
  query,
  create,
  update,
  remove,
  renderExtra,
  dependentKeys = DEFAULT_DEPENDENT_KEYS,
}: SimpleCatalogPanelProps) {
  const queryClient = useQueryClient();
  const itemsResult = useQuery(query);
  const items = itemsResult.data ?? EMPTY_ITEMS;
  const loading = itemsResult.isPending;
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<DestinoOption | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DestinoOption | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

  function setItems(updater: (current: DestinoOption[]) => DestinoOption[]) {
    updateCachedList<DestinoOption>(queryClient, query.queryKey, updater);
    invalidateKeys(queryClient, ...dependentKeys);
  }

  async function handleFormSubmit(nombre: string) {
    if (editItem) {
      const updated = await update(editItem.id, nombre);
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } else {
      const created = await create(nombre);
      setItems((current) => [...current, created]);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await remove(deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {items.length} {items.length === 1 ? "registro" : "registros"}
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditItem(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {newLabel}
        </Button>
      </div>

      <CatalogList
        items={items}
        loading={loading}
        emptyLabel={`Sin ${title.toLowerCase()} registrados todavía.`}
        onEdit={(item) => {
          setEditItem(item);
          setFormOpen(true);
        }}
        onDelete={(item) => {
          setDeleteTarget(item);
          setDeleteError(undefined);
        }}
        renderExtra={renderExtra}
      />

      <CatalogFormModal
        open={formOpen}
        title={editItem ? `Editar ${singularLabel.toLowerCase()}` : newLabel}
        label={singularLabel}
        editItem={editItem}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Eliminar ${singularLabel.toLowerCase()}`}
        description={
          deleteTarget
            ? `¿Seguro que quieres eliminar "${deleteTarget.label}"? Si tiene alumnos u otros registros vinculados, no se podrá eliminar.`
            : undefined
        }
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
