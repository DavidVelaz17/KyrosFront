"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { Banknote, CreditCard, Printer, Receipt, UserPlus } from "lucide-react";
import type { Student } from "@/lib/types/student";
import {
  allStudentsQuery,
  invalidateAfterPaymentChange,
  invalidateKeys,
  queryKeys,
  updateCachedList,
} from "@/lib/query/queries";
import { useGroups } from "@/components/groups/groups-provider";
import { StudentFormModal } from "@/components/students/student-form-modal";
import { NewCargoModal } from "@/components/quick-actions/new-cargo-modal";
import { NewPagoModal } from "@/components/quick-actions/new-pago-modal";
import { NewEgresoModal } from "@/components/egresos/new-egreso-modal";
import { GenerarReporteModal } from "@/components/pagos/generar-reporte-modal";
import { useSessionUser } from "@/components/auth/session-provider";
import { canViewEgresos } from "@/lib/types/auth";
import type { Egreso } from "@/lib/types/egreso";

type ModalKind = "alumno" | "cargo" | "pago" | "egreso" | "reporte" | null;

const EMPTY_STUDENTS: Student[] = [];

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800 dark:hover:bg-indigo-900/20"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
        <Icon className="h-8 w-8" />
      </span>
      <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
    </button>
  );
}

export function QuickActionsPage() {
  const { groups } = useGroups();
  const queryClient = useQueryClient();
  const sessionUser = useSessionUser();
  const showEgreso = canViewEgresos(sessionUser.rol);
  // Catálogo de alumnos para las barras de búsqueda de "Nuevo cargo" / "Nuevo pago": sale al
  // instante de la copia local y se refresca en segundo plano.
  const { data: students = EMPTY_STUDENTS } = useQuery(allStudentsQuery());
  const [activeModal, setActiveModal] = useState<ModalKind>(null);

  function closeModal() {
    // Los modales de alumno, cargo y pago pueden registrar pagos o cargos (el alta incluye el pago
    // de inscripción): al cerrarlos se marcan como desactualizados sin importar qué ruta se tomó.
    invalidateAfterPaymentChange(queryClient);
    setActiveModal(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Acciones rápidas</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Los accesos directos más usados, a un clic de distancia.</p>
      </div>

      <div
        className={
          // Siempre en dos filas: 3 + 2 con Egreso, 2 + 2 sin él.
          showEgreso ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-4 sm:grid-cols-2"
        }
      >
        <QuickActionButton icon={UserPlus} label="Nuevo Alumno" onClick={() => setActiveModal("alumno")} />
        <QuickActionButton icon={Receipt} label="Nuevo Cargo" onClick={() => setActiveModal("cargo")} />
        <QuickActionButton icon={CreditCard} label="Nuevo Pago" onClick={() => setActiveModal("pago")} />
        {showEgreso && <QuickActionButton icon={Banknote} label="Nuevo Egreso" onClick={() => setActiveModal("egreso")} />}
        <QuickActionButton icon={Printer} label="Reporte de Pagos" onClick={() => setActiveModal("reporte")} />
      </div>

      <StudentFormModal
        open={activeModal === "alumno"}
        onClose={closeModal}
        groups={groups}
        defaultGroupId=""
        onCreated={(created) => {
          updateCachedList<Student>(queryClient, queryKeys.allStudents, (current) => [
            ...current.filter((student) => student.id !== created.id),
            created as Student,
          ]);
          invalidateKeys(queryClient, queryKeys.students);
        }}
      />
      <NewCargoModal
        open={activeModal === "cargo"}
        onClose={closeModal}
        students={students}
        onCreated={() => {}}
      />
      <NewPagoModal
        open={activeModal === "pago"}
        onClose={closeModal}
        students={students}
        onCreated={() => {}}
      />
      {/* El mismo modal que el botón "Generar reporte" de Pagos. Solo lee datos, así que al cerrarlo
       *  no hace falta refrescar pagos ni cargos (por eso no usa closeModal). */}
      <GenerarReporteModal open={activeModal === "reporte"} onClose={() => setActiveModal(null)} />
      {showEgreso && (
        <NewEgresoModal
          open={activeModal === "egreso"}
          onClose={closeModal}
          onCreated={(egreso) => updateCachedList<Egreso>(queryClient, queryKeys.egresos, (current) => [...current, egreso])}
        />
      )}
    </div>
  );
}
