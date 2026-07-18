"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CreditCard, Receipt, UserPlus } from "lucide-react";
import type { Student } from "@/lib/types/student";
import { listAllStudents } from "@/lib/api/students";
import { useGroups } from "@/components/groups/groups-provider";
import { StudentFormModal } from "@/components/students/student-form-modal";
import { NewCargoModal } from "@/components/quick-actions/new-cargo-modal";
import { NewPagoModal } from "@/components/quick-actions/new-pago-modal";

type ModalKind = "alumno" | "cargo" | "pago" | null;

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
  const [students, setStudents] = useState<Student[]>([]);
  const [activeModal, setActiveModal] = useState<ModalKind>(null);

  useEffect(() => {
    let cancelled = false;
    listAllStudents().then((data) => {
      if (!cancelled) setStudents(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function closeModal() {
    setActiveModal(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Acciones rápidas</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Los accesos directos más usados, a un clic de distancia.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickActionButton icon={UserPlus} label="Nuevo Alumno" onClick={() => setActiveModal("alumno")} />
        <QuickActionButton icon={Receipt} label="Nuevo Cargo" onClick={() => setActiveModal("cargo")} />
        <QuickActionButton icon={CreditCard} label="Nuevo Pago" onClick={() => setActiveModal("pago")} />
      </div>

      <StudentFormModal
        open={activeModal === "alumno"}
        onClose={closeModal}
        groups={groups}
        defaultGroupId=""
        onCreated={(created) => setStudents((current) => [...current, created as Student])}
      />
      <NewCargoModal open={activeModal === "cargo"} onClose={closeModal} students={students} onCreated={() => {}} />
      <NewPagoModal open={activeModal === "pago"} onClose={closeModal} students={students} onCreated={() => {}} />
    </div>
  );
}
