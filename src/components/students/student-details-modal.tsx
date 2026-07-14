"use client";

import { useEffect, useState } from "react";
import type { Student } from "@/lib/types/student";
import { studentFullName } from "@/lib/types/student";
import { getDestinos, type StudentDestino } from "@/lib/api/students";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils/format";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">{value || "—"}</p>
    </div>
  );
}

export function StudentDetailsModal({ open, onClose, student }: { open: boolean; onClose: () => void; student: Student | null }) {
  const [destinos, setDestinos] = useState<StudentDestino[]>([]);
  const [loadingDestinos, setLoadingDestinos] = useState(false);
  const studentId = student?.id;

  useEffect(() => {
    if (!open || !studentId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia destinos del alumno anterior cuando se cierra el modal
      setDestinos([]);
      return;
    }
    let cancelled = false;
    setLoadingDestinos(true);
    getDestinos(studentId).then((data) => {
      if (cancelled) return;
      setDestinos(data);
      setLoadingDestinos(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, studentId]);

  if (!student) return null;

  return (
    <Modal open={open} onClose={onClose} title="Información del alumno" size="lg">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar src={student.fotoUrl} label={student.nombre.slice(0, 2).toUpperCase()} size={64} />
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{studentFullName(student)}</p>
            <p className="font-mono text-sm text-zinc-500">{student.matricula}</p>
            <div className="mt-1 flex gap-2">
              <Badge tone="indigo">{student.ingresoA}</Badge>
              <Badge>{student.horario}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Edad" value={String(student.edad)} />
          <DetailItem label="Teléfono" value={student.telefono} />
          <DetailItem label="Escuela de procedencia" value={student.escuelaProcedencia} />
          <DetailItem label="Grado escolar" value={student.gradoEscolar} />
          <DetailItem label="Fecha de inscripción" value={formatDate(student.fechaInscripcion)} />
          <DetailItem label="Horario" value={student.horario} />
          <DetailItem label="Nombre del tutor" value={student.tutorNombre} />
          <DetailItem label="Número del tutor" value={student.tutorTelefono} />
        </div>

        <DetailItem label="Dirección" value={student.direccion} />
        <DetailItem label="Notas" value={student.notas} />

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Información de {student.ingresoA}
          </p>
          {loadingDestinos ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : destinos.length === 0 ? (
            <p className="text-sm text-zinc-500">Sin información registrada.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {destinos.map((destino) => (
                <div key={destino.id} className="flex flex-col gap-1 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                  <Badge tone="indigo">{destino.nombre}</Badge>
                  {destino.carreras && destino.carreras.length > 0 && (
                    <div className="flex flex-col">
                      {destino.carreras.map((carrera, index) => (
                        <p key={index} className="text-xs text-zinc-500 dark:text-zinc-400">
                          {carrera.nombre} · {carrera.areaNombre}
                        </p>
                      ))}
                    </div>
                  )}
                  {destino.materias && destino.materias.length > 0 && (
                    <div className="flex flex-col">
                      {destino.materias.map((materia) => (
                        <p key={materia.id} className="text-xs text-zinc-500 dark:text-zinc-400">
                          {materia.nombre}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
