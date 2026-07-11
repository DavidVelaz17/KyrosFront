"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { Student } from "@/lib/types/student";
import { studentFullName } from "@/lib/types/student";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

interface StudentSearchFieldProps {
  students: Student[];
  selected: Student | null;
  onSelect: (student: Student | null) => void;
  error?: string;
}

/** Busca un alumno por nombre o matrícula y, al seleccionarlo, muestra su nombre,
 *  apellidos y horario de solo lectura para confirmar de quién se trata. */
export function StudentSearchField({ students, selected, onSelect, error }: StudentSearchFieldProps) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const results = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (q.length === 0) return [];
    return students
      .filter((s) => studentFullName(s).toLowerCase().includes(q) || s.matricula.toLowerCase().includes(q))
      .slice(0, 8);
  }, [students, term]);

  if (selected) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/60">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{studentFullName(selected)}</p>
            <p className="font-mono text-xs text-zinc-500">{selected.matricula}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setTerm("");
            }}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800"
            aria-label="Cambiar alumno"
            title="Cambiar alumno"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre(s)" htmlFor="alumno-nombre">
            <Input id="alumno-nombre" value={selected.nombre} disabled />
          </Field>
          <Field label="Apellido paterno" htmlFor="alumno-apellidoPaterno">
            <Input id="alumno-apellidoPaterno" value={selected.apellidoPaterno} disabled />
          </Field>
          <Field label="Apellido materno" htmlFor="alumno-apellidoMaterno">
            <Input id="alumno-apellidoMaterno" value={selected.apellidoMaterno} disabled />
          </Field>
          <Field label="Horario" htmlFor="alumno-horario">
            <Input id="alumno-horario" value={selected.horario} disabled />
          </Field>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <Field label="Buscar alumno" htmlFor="alumno-busqueda" error={error} required>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            id="alumno-busqueda"
            className="pl-9"
            placeholder="Busca por nombre o matrícula..."
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
        </div>
      </Field>
      {open && term.trim().length > 0 && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-zinc-500">Sin resultados.</p>
          ) : (
            results.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  onSelect(student);
                  setTerm("");
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{studentFullName(student)}</span>
                <span className="font-mono text-xs text-zinc-500">{student.matricula}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
