"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { Student } from "@/lib/types/student";
import { studentFullName } from "@/lib/types/student";
import { getDestinos, type StudentDestino } from "@/lib/api/students";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

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
  const [showFullPhoto, setShowFullPhoto] = useState(false);
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

  // Escape cierra primero la foto ampliada, no el modal completo: sin esto, el <dialog> nativo
  // del modal de abajo captura el Escape y cierra todo de un solo golpe (ver Modal.onCancel).
  useEffect(() => {
    if (!showFullPhoto) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setShowFullPhoto(false);
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [showFullPhoto]);

  if (!student) return null;

  return (
    <Modal open={open} onClose={onClose} title="Información del alumno" size="lg">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => student.fotoUrl && setShowFullPhoto(true)}
            disabled={!student.fotoUrl}
            className={cn("rounded-full", student.fotoUrl && "cursor-zoom-in")}
            aria-label={student.fotoUrl ? "Ver foto en grande" : undefined}
          >
            <Avatar src={student.fotoUrl} label={student.nombre.slice(0, 2).toUpperCase()} size={64} />
          </button>
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

      {/* Dentro del <dialog> a propósito (no como hermano fuera del Modal): un <dialog> abierto
       *  vive en el "top layer" del navegador, por encima de cualquier elemento normal sin
       *  importar su z-index — para que esto se vea por encima del modal, tiene que pintarse
       *  como descendiente suyo, no al lado. */}
      {showFullPhoto && student.fotoUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/90 p-6"
          onClick={() => setShowFullPhoto(false)}
        >
          <button
            type="button"
            onClick={() => setShowFullPhoto(false)}
            className="absolute right-4 top-4 rounded-md p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
          <Image
            src={student.fotoUrl}
            alt={studentFullName(student)}
            width={640}
            height={640}
            unoptimized
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </Modal>
  );
}
