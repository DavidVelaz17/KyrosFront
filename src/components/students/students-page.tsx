"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import type { Group } from "@/lib/types/group";
import type { Payment } from "@/lib/types/payment";
import type { Student } from "@/lib/types/student";
import { studentFullName } from "@/lib/types/student";
import { listStudentsByGroup } from "@/lib/api/students";
import { listPaymentsByStudent } from "@/lib/api/payments";
import { listUniversidades } from "@/lib/api/destinos";
import { useGroups } from "@/components/groups/groups-provider";
import { StudentsFilterBar } from "@/components/students/students-filter-bar";
import { StudentsTable } from "@/components/students/students-table";
import { buildStudentColumns } from "@/components/students/student-columns";
import { StudentFormModal } from "@/components/students/student-form-modal";
import { StudentDetailsModal } from "@/components/students/student-details-modal";
import { BajaAlumnoModal } from "@/components/students/baja-alumno-modal";
import { PayModal } from "@/components/students/pay-modal";
import { PaymentHistoryModal } from "@/components/students/payment-history-modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { STUDENT_COLUMN_DEFAULT_VISIBILITY } from "@/lib/constants/student-columns";
import { formatDate } from "@/lib/utils/format";
import { cargoAlertRowClass } from "@/lib/utils/cargo";
import { resolveStudentUniversidades, useStudentUniversidades } from "@/hooks/use-student-universidades";
import { useStudentCargoAlerts } from "@/hooks/use-student-cargo-alerts";

type ModalKind = "create" | "edit" | "view" | "pay" | "history" | "baja" | null;

export function StudentsPage({ group }: { group: Group }) {
  const { groups } = useGroups();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [universidad, setUniversidad] = useState("");
  const [universidadCatalog, setUniversidadCatalog] = useState<string[]>([]);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "kyros:columns:students",
    STUDENT_COLUMN_DEFAULT_VISIBILITY
  );

  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [historyPayments, setHistoryPayments] = useState<Payment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadedGroupId, setLoadedGroupId] = useState<string | null>(null);

  if (group.id !== loadedGroupId) {
    setLoadedGroupId(group.id);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    listStudentsByGroup(group.id).then((data) => {
      if (!cancelled) {
        setStudents(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [group.id]);

  const universidadMap = useStudentUniversidades(students);
  const cargoAlerts = useStudentCargoAlerts(students);

  useEffect(() => {
    let cancelled = false;
    listUniversidades().then((options) => {
      if (!cancelled) setUniversidadCatalog(options.map((option) => option.label).sort());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch = term.length === 0 || studentFullName(student).toLowerCase().includes(term);
      const matchesUniversidad = !universidad || resolveStudentUniversidades(student, universidadMap).includes(universidad);
      return matchesSearch && matchesUniversidad;
    });
  }, [students, search, universidad, universidadMap]);

  const columns = useMemo(
    () =>
      buildStudentColumns({
        resolveGroupName: () => group.nombre,
        resolveUniversidad: (student) => resolveStudentUniversidades(student, universidadMap),
        onView: (student) => {
          setSelectedStudent(student);
          setActiveModal("view");
        },
        onEdit: (student) => {
          setSelectedStudent(student);
          setActiveModal("edit");
        },
        onPay: (student) => {
          setSelectedStudent(student);
          setActiveModal("pay");
        },
        onHistory: (student) => {
          setSelectedStudent(student);
          setActiveModal("history");
          setHistoryLoading(true);
          listPaymentsByStudent(student.id).then((data) => {
            setHistoryPayments(data);
            setHistoryLoading(false);
          });
        },
        onBaja: (student) => {
          setSelectedStudent(student);
          setActiveModal("baja");
        },
      }),
    [group.nombre, universidadMap]
  );

  function closeModal() {
    setActiveModal(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{group.nombre}</h1>
          <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{group.plantel}</span>
            <span aria-hidden>·</span>
            <span>Inicio: {formatDate(group.fechaInicio)}</span>
            <span aria-hidden>·</span>
            <span>
              {students.length} {students.length === 1 ? "alumno" : "alumnos"}
            </span>
          </p>
        </div>
        <Button onClick={() => setActiveModal("create")}>
          <Plus className="h-4 w-4" />
          Nuevo alumno
        </Button>
      </div>

      <StudentsFilterBar
        search={search}
        onSearchChange={setSearch}
        universidad={universidad}
        onUniversidadChange={setUniversidad}
        universidadOptions={universidadCatalog}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      />

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner />
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <Users className="h-10 w-10 text-zinc-400" />
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">Sin alumnos inscritos</p>
            <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Registra al primer alumno de este grupo.
            </p>
          </div>
          <Button onClick={() => setActiveModal("create")}>
            <Plus className="h-4 w-4" />
            Nuevo alumno
          </Button>
        </div>
      ) : (
        <StudentsTable
          data={filteredStudents}
          columns={columns}
          columnVisibility={columnVisibility}
          rowClassName={(student) => cargoAlertRowClass(cargoAlerts[student.id] ?? "none")}
        />
      )}

      <StudentFormModal
        open={activeModal === "create" || activeModal === "edit"}
        onClose={closeModal}
        groups={groups}
        defaultGroupId={group.id}
        editStudent={activeModal === "edit" ? selectedStudent : null}
        onCreated={(created) => {
          // Reemplaza en vez de duplicar: si "created" viene de reasignar/editar un alumno que
          // ya estaba en esta lista, actualiza su fila en lugar de agregar una segunda.
          setStudents((current) => {
            const withoutPrevious = current.filter((student) => student.id !== created.id);
            return created.grupoId === group.id ? [...withoutPrevious, created as Student] : withoutPrevious;
          });
        }}
      />
      <StudentDetailsModal open={activeModal === "view"} onClose={closeModal} student={selectedStudent} />
      <BajaAlumnoModal
        open={activeModal === "baja"}
        onClose={closeModal}
        student={selectedStudent}
        onBaja={(updated) => setStudents((current) => current.map((s) => (s.id === updated.id ? updated : s)))}
      />
      <PayModal
        open={activeModal === "pay"}
        onClose={closeModal}
        student={selectedStudent}
        onPaid={(payment) => setHistoryPayments((current) => [...current, payment])}
      />
      <PaymentHistoryModal
        open={activeModal === "history"}
        onClose={closeModal}
        student={selectedStudent}
        payments={historyPayments}
        loading={historyLoading}
      />
    </div>
  );
}
