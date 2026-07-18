"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import type { Student } from "@/lib/types/student";
import { studentFullName } from "@/lib/types/student";
import { updateStudentEstatus } from "@/lib/api/students";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface BajaAlumnoModalProps {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  onBaja: (student: Student) => void;
}

/** Confirma "dar de baja" a un alumno: el registro no se borra, solo cambia su estatus a
 *  Baja (conserva historial, pagos, destinos, etc.). */
export function BajaAlumnoModal({ open, onClose, student, onBaja }: BajaAlumnoModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!student) return null;

  async function handleConfirm() {
    if (!student) return;
    setSubmitting(true);
    try {
      const updated = await updateStudentEstatus(student.id, "Baja");
      onBaja(updated);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dar de baja"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Dando de baja..." : "Dar de baja"}
          </Button>
        </div>
      }
    >
      <div className="flex gap-3">
        <TriangleAlert className="h-9 w-9 shrink-0 text-amber-500" />
        <div className="flex flex-col gap-1">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Estás a punto de dar de baja a <span className="font-medium text-zinc-900 dark:text-zinc-100">{studentFullName(student)}</span>.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            El alumno no se eliminará: seguirá visible en las tablas marcado como &quot;Baja&quot;, y conserva su historial
            de pagos y su información.
          </p>
        </div>
      </div>
    </Modal>
  );
}
