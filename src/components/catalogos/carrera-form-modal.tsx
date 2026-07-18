"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { DestinoOption } from "@/lib/api/destinos";
import type { Carrera } from "@/lib/api/catalogos";

interface CarreraFormModalProps {
  open: boolean;
  areas: DestinoOption[];
  editItem?: Carrera | null;
  onClose: () => void;
  onSubmit: (nombre: string, idArea: string) => Promise<void>;
}

/** Crea o edita una carrera (nombre + área). El área es obligatoria: toda carrera pertenece a
 *  una sola área (ver tabla `carrera`, FK `id_area NOT NULL`). */
export function CarreraFormModal({ open, areas, editItem = null, onClose, onSubmit }: CarreraFormModalProps) {
  const [nombre, setNombre] = useState("");
  const [idArea, setIdArea] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- precarga el formulario al abrir (crear u editar)
      setNombre(editItem?.nombre ?? "");
      setIdArea(editItem?.areaId ?? areas[0]?.id ?? "");
      setError(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editItem]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed) {
      setError("El nombre de la carrera es requerido");
      return;
    }
    if (!idArea) {
      setError("Selecciona un área");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(trimmed, idArea);
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
      title={editItem ? "Editar carrera" : "Nueva carrera"}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="carrera-form" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      }
    >
      <form id="carrera-form" className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Field label="Carrera" htmlFor="carrera-nombre" error={error} required>
          <Input id="carrera-nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} autoFocus />
        </Field>
        <Field label="Área" htmlFor="carrera-area" required>
          <Select id="carrera-area" value={idArea} onChange={(event) => setIdArea(event.target.value)}>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.label}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
