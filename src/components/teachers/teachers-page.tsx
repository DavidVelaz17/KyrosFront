"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import type { Teacher } from "@/lib/types/teacher";
import { listTeachers } from "@/lib/api/teachers";
import { buildTeacherColumns } from "@/components/teachers/teacher-columns";
import { TeachersTable } from "@/components/teachers/teachers-table";
import { TeacherFormModal } from "@/components/teachers/teacher-form-modal";
import { TeacherDetailsModal } from "@/components/teachers/teacher-details-modal";
import { ResetPasswordModal } from "@/components/teachers/reset-password-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";

type ModalKind = "create" | "edit" | "view" | "resetPassword" | null;

export function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    let cancelled = false;
    listTeachers().then((data) => {
      if (!cancelled) {
        setTeachers(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTeachers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length === 0) return teachers;
    return teachers.filter(
      (teacher) => teacher.nombreUsuario.toLowerCase().includes(term) || teacher.usuario.toLowerCase().includes(term)
    );
  }, [teachers, search]);

  const columns = useMemo(
    () =>
      buildTeacherColumns({
        onView: (teacher) => {
          setSelectedTeacher(teacher);
          setActiveModal("view");
        },
        onEdit: (teacher) => {
          setSelectedTeacher(teacher);
          setActiveModal("edit");
        },
        onResetPassword: (teacher) => {
          setSelectedTeacher(teacher);
          setActiveModal("resetPassword");
        },
      }),
    []
  );

  function closeModal() {
    setActiveModal(null);
  }

  function upsertTeacher(teacher: Teacher) {
    setTeachers((current) => {
      const exists = current.some((item) => item.id === teacher.id);
      return exists ? current.map((item) => (item.id === teacher.id ? teacher : item)) : [...current, teacher];
    });
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Profesores</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {teachers.length} {teachers.length === 1 ? "profesor registrado" : "profesores registrados"}
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedTeacher(null);
            setActiveModal("create");
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo profesor
        </Button>
      </div>

      <div className="relative sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          className="pl-9"
          placeholder="Buscar profesor..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {teachers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin profesores registrados"
          description="Da de alta al primer profesor con el botón 'Nuevo profesor'."
        />
      ) : (
        <TeachersTable data={filteredTeachers} columns={columns} />
      )}

      <TeacherFormModal
        open={activeModal === "create" || activeModal === "edit"}
        onClose={closeModal}
        teacher={activeModal === "edit" ? selectedTeacher : null}
        onSaved={upsertTeacher}
      />
      <TeacherDetailsModal open={activeModal === "view"} onClose={closeModal} teacher={selectedTeacher} />
      <ResetPasswordModal
        open={activeModal === "resetPassword"}
        onClose={closeModal}
        teacher={selectedTeacher}
        onReset={upsertTeacher}
      />
    </div>
  );
}
