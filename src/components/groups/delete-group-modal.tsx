"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import type { Group } from "@/lib/types/group";
import { deleteGroup } from "@/lib/api/groups";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface DeleteGroupModalProps {
  open: boolean;
  onClose: () => void;
  group: Group | null;
  onDeleted: (group: Group) => void;
}

/** Elimina el grupo por completo (a diferencia de "Dar de baja" en alumnos, esto sí borra el
 *  registro). Sus alumnos no se eliminan: el backend los desasocia y quedan "Sin grupo"
 *  (fk_estudiante_grupo ON DELETE SET NULL), conservando su historial y datos. */
export function DeleteGroupModal({ open, onClose, group, onDeleted }: DeleteGroupModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!group) return null;

  async function handleConfirm() {
    if (!group) return;
    setSubmitting(true);
    try {
      await deleteGroup(group.id);
      onDeleted(group);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar grupo"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Eliminando..." : "Eliminar grupo"}
          </Button>
        </div>
      }
    >
      <div className="flex gap-3">
        <TriangleAlert className="h-9 w-9 shrink-0 text-red-500" />
        <div className="flex flex-col gap-1">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Estás a punto de eliminar el grupo <span className="font-medium text-zinc-900 dark:text-zinc-100">{group.nombre}</span>.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Esta acción no se puede deshacer. Sus alumnos no se eliminan: quedarán marcados como
            &quot;Sin grupo&quot; y conservan todo su historial e información.
          </p>
        </div>
      </div>
    </Modal>
  );
}
