"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import type { Group } from "@/lib/types/group";
import type { Payment } from "@/lib/types/payment";
import type { Student } from "@/lib/types/student";
import { studentFullName } from "@/lib/types/student";
import { listPaymentsByStudent } from "@/lib/api/payments";
import {
  catalogQueries,
  invalidateAfterPaymentChange,
  invalidateKeys,
  queryKeys,
  studentsByGroupQuery,
  updateCachedList,
} from "@/lib/query/queries";
import { useGroups } from "@/components/groups/groups-provider";
import { GroupFormModal } from "@/components/groups/group-form-modal";
import { DeleteGroupModal } from "@/components/groups/delete-group-modal";
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
import { EMPTY_STUDENT_FILTERS, type StudentFilters } from "@/lib/types/student-filters";
import { matchesStudentFilters } from "@/lib/utils/student-filters";
import { useSessionUser } from "@/components/auth/session-provider";
import { isAdminOrCoordinador } from "@/lib/types/auth";

type ModalKind = "create" | "edit" | "view" | "pay" | "history" | "baja" | null;
type GroupModalKind = "edit" | "delete" | null;

const EMPTY_STUDENTS: Student[] = [];

export function StudentsPage({ group }: { group: Group }) {
  const router = useRouter();
  const sessionUser = useSessionUser();
  const canManageGroup = isAdminOrCoordinador(sessionUser.rol);
  const { groups, removeGroup } = useGroups();
  const [groupModal, setGroupModal] = useState<GroupModalKind>(null);
  const queryClient = useQueryClient();
  const studentsQuery = useQuery(studentsByGroupQuery(group.id));
  const students = studentsQuery.data ?? EMPTY_STUDENTS;
  const loading = studentsQuery.isPending;
  const [search, setSearch] = useState("");
  const { data: universidades } = useQuery(catalogQueries.universidades);
  const universidadCatalog = useMemo(
    () => (universidades ?? []).map((option) => option.label).sort(),
    [universidades]
  );
  const [filters, setFilters] = useState<StudentFilters>(EMPTY_STUDENT_FILTERS);
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(
    "kyros:columns:students",
    STUDENT_COLUMN_DEFAULT_VISIBILITY
  );

  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [historyPayments, setHistoryPayments] = useState<Payment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // GroupStudentsLoader pasa `group` como una foto fija tomada al montar; tras editarlo aquí
  // mismo (GroupFormModal actualiza el contexto de grupos), esto refleja el cambio sin necesitar
  // recargar la página ni levantar el estado hasta el loader.
  const currentGroup = groups.find((candidate) => candidate.id === group.id) ?? group;

  /** Refleja en la lista cacheada de este grupo lo que el servidor ya respondió, y marca como
   *  desactualizadas las demás listas de alumnos (la de "Alumnos" y la de otro grupo si se
   *  reasignó) para que se refresquen en segundo plano. */
  function setStudents(updater: (current: Student[]) => Student[]) {
    updateCachedList<Student>(queryClient, queryKeys.studentsByGroup(group.id), updater);
    invalidateKeys(queryClient, queryKeys.students);
  }

  const universidadMap = useStudentUniversidades(students);
  const cargoAlerts = useStudentCargoAlerts(students);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch = term.length === 0 || studentFullName(student).toLowerCase().includes(term);
      const matchesFilters = matchesStudentFilters(student, filters, resolveStudentUniversidades(student, universidadMap));
      return matchesSearch && matchesFilters;
    });
  }, [students, search, filters, universidadMap]);

  const columns = useMemo(
    () =>
      buildStudentColumns({
        resolveGroupName: () => currentGroup.nombre,
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
    [currentGroup.nombre, universidadMap]
  );

  function closeModal() {
    // El alta/edición puede registrar el pago de inscripción y cargos extra, y el modal de pago
    // puede crear cargos sin pago: al cerrarlos se refrescan pagos y cargos sin importar la ruta.
    if (activeModal === "pay" || activeModal === "create" || activeModal === "edit") {
      invalidateAfterPaymentChange(queryClient);
    }
    setActiveModal(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{currentGroup.nombre}</h1>
            {canManageGroup && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setGroupModal("edit")}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  title="Editar grupo"
                  aria-label="Editar grupo"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setGroupModal("delete")}
                  className="rounded-md p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  title="Eliminar grupo"
                  aria-label="Eliminar grupo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{currentGroup.plantel}</span>
            <span aria-hidden>·</span>
            <span>Inicio: {formatDate(currentGroup.fechaInicio)}</span>
            <span aria-hidden>·</span>
            <span>{currentGroup.horario}</span>
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
        filters={filters}
        onFiltersChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
        onClearFilters={() => setFilters(EMPTY_STUDENT_FILTERS)}
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

      {canManageGroup && (
        <>
          <GroupFormModal
            open={groupModal === "edit"}
            onClose={() => setGroupModal(null)}
            editGroup={currentGroup}
          />
          <DeleteGroupModal
            open={groupModal === "delete"}
            onClose={() => setGroupModal(null)}
            group={currentGroup}
            onDeleted={(deleted) => {
              removeGroup(deleted.id);
              router.push("/dashboard/grupos");
            }}
          />
        </>
      )}
    </div>
  );
}
