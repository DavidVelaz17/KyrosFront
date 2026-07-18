"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DestinoOption } from "@/lib/api/destinos";

interface CatalogFormModalProps {
  open: boolean;
  /** Ej. "Nueva universidad" / "Editar universidad". */
  title: string;
  /** Ej. "Universidad" — usado como etiqueta del campo y en el mensaje de validación. */
  label: string;
  editItem?: DestinoOption | null;
  onClose: () => void;
  onSubmit: (nombre: string) => Promise<void>;
}

/** Formulario de un solo campo (nombre), reutilizado para crear/editar Universidad, Bachillerato,
 *  Secundaria y Materia — catálogos que solo tienen un nombre como dato. */
export function CatalogFormModal({ open, title, label, editItem = null, onClose, onSubmit }: CatalogFormModalProps) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- precarga el formulario al abrir (crear u editar)
      setNombre(editItem?.label ?? "");
      setError(undefined);
    }
  }, [open, editItem]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed) {
      setError(`${label} es requerido`);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="catalog-form" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      }
    >
      <form id="catalog-form" onSubmit={handleSubmit}>
        <Field label={label} htmlFor="catalog-nombre" error={error} required>
          <Input id="catalog-nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} autoFocus />
        </Field>
      </form>
    </Modal>
  );
}
