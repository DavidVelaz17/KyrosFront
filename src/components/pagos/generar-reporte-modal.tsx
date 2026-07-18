"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import type { Student } from "@/lib/types/student";
import { INGRESO_A_OPTIONS } from "@/lib/types/student";
import { listAllStudents } from "@/lib/api/students";
import { listUniversidades, type DestinoOption } from "@/lib/api/destinos";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StudentSearchField } from "@/components/quick-actions/student-search-field";
import { cn } from "@/lib/utils/cn";
import { todayISODate } from "@/lib/utils/format";

const DATE_MODE_OPTIONS = ["Todos", "Día", "Mes", "Rango"] as const;
type DateMode = (typeof DATE_MODE_OPTIONS)[number];

interface GenerarReporteModalProps {
  open: boolean;
  onClose: () => void;
}

/** Junta los filtros elegidos y abre /reportes/pagos en una pestaña nueva (que a su vez
 *  dispara window.print() sola al cargar) — ahí es donde se ve/imprime/guarda como PDF. */
export function GenerarReporteModal({ open, onClose }: GenerarReporteModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [universidades, setUniversidades] = useState<DestinoOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [universidad, setUniversidad] = useState("");
  const [ingresoA, setIngresoA] = useState("");
  const [dateMode, setDateMode] = useState<DateMode>("Todos");
  const [dia, setDia] = useState(todayISODate());
  const [mes, setMes] = useState(todayISODate().slice(0, 7));
  const [desde, setDesde] = useState(todayISODate());
  const [hasta, setHasta] = useState(todayISODate());

  useEffect(() => {
    if (!open) return;
    listAllStudents().then(setStudents);
    listUniversidades().then(setUniversidades);
  }, [open]);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetea los filtros locales al cerrar el modal
      setSelectedStudent(null);
      setUniversidad("");
      setIngresoA("");
      setDateMode("Todos");
    }
  }, [open]);

  function handleGenerar() {
    const params = new URLSearchParams();
    if (selectedStudent) params.set("studentId", selectedStudent.id);
    if (universidad) params.set("universidad", universidad);
    if (ingresoA) params.set("ingresoA", ingresoA);
    if (dateMode === "Día") params.set("dia", dia);
    if (dateMode === "Mes") params.set("mes", mes);
    if (dateMode === "Rango") {
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
    }
    window.open(`/reportes/pagos?${params.toString()}`, "_blank");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generar reporte de pagos"
      description="Filtra los pagos a incluir. El reporte se abre en una pestaña nueva lista para imprimir o guardar como PDF."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleGenerar}>
            <Printer className="h-4 w-4" />
            Generar reporte
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <StudentSearchField students={students} selected={selectedStudent} onSelect={setSelectedStudent} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Universidad" htmlFor="reporte-universidad">
            <Select id="reporte-universidad" value={universidad} onChange={(event) => setUniversidad(event.target.value)}>
              <option value="">Todas</option>
              {universidades.map((option) => (
                <option key={option.id} value={option.label}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ingresa a" htmlFor="reporte-ingresoA">
            <Select id="reporte-ingresoA" value={ingresoA} onChange={(event) => setIngresoA(event.target.value)}>
              <option value="">Todos</option>
              {INGRESO_A_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Filtrar por fecha</p>
          <div className="grid grid-cols-4 gap-2">
            {DATE_MODE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDateMode(option)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                  dateMode === option
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                {option}
              </button>
            ))}
          </div>

          {dateMode === "Día" && (
            <Field label="Día" htmlFor="reporte-dia" className="mt-3">
              <Input id="reporte-dia" type="date" value={dia} onChange={(event) => setDia(event.target.value)} />
            </Field>
          )}
          {dateMode === "Mes" && (
            <Field label="Mes" htmlFor="reporte-mes" className="mt-3">
              <Input id="reporte-mes" type="month" value={mes} onChange={(event) => setMes(event.target.value)} />
            </Field>
          )}
          {dateMode === "Rango" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Desde" htmlFor="reporte-desde">
                <Input id="reporte-desde" type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
              </Field>
              <Field label="Hasta" htmlFor="reporte-hasta">
                <Input id="reporte-hasta" type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} />
              </Field>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
