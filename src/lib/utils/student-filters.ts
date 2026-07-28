import type { Student } from "@/lib/types/student";
import { EMPTY_VALUE_FILTER, type StudentFilters } from "@/lib/types/student-filters";

function includesText(value: string | undefined, term: string): boolean {
  if (!term) return true;
  return (value ?? "").toLowerCase().includes(term.toLowerCase());
}

/** true si el valor coincide con el filtro de un select que puede pedir "Sin especificar"
 *  (EMPTY_VALUE_FILTER) además de un valor concreto o "todos" (filtro vacío). */
function matchesSelectable(value: string | undefined, filter: string): boolean {
  if (!filter) return true;
  if (filter === EMPTY_VALUE_FILTER) return !value;
  return value === filter;
}

/** Evalúa un alumno contra todos los filtros de la tabla a la vez. `resolvedUniversidades` ya
 *  viene resuelto por el caller (useStudentUniversidades) porque depende de los destinos
 *  cargados aparte, no de un campo plano del alumno. */
export function matchesStudentFilters(
  student: Student,
  filters: StudentFilters,
  resolvedUniversidades: string[]
): boolean {
  if (filters.estatus && student.estatus !== filters.estatus) return false;
  if (!matchesSelectable(student.ingresoA, filters.ingresoA)) return false;
  if (!matchesSelectable(student.horario, filters.horario)) return false;
  if (filters.universidad && !resolvedUniversidades.includes(filters.universidad)) return false;
  if (filters.grupo && student.grupoId !== filters.grupo) return false;

  if (!includesText(student.matricula, filters.matricula)) return false;
  if (!includesText(student.telefono, filters.telefono)) return false;
  if (!includesText(student.gradoEscolar, filters.gradoEscolar)) return false;
  if (!includesText(student.tutorNombre, filters.tutorNombre)) return false;
  if (!includesText(student.tutorTelefono, filters.tutorTelefono)) return false;
  if (!includesText(student.direccion, filters.direccion)) return false;
  if (!includesText(student.notas, filters.notas)) return false;

  if (filters.edadMin && (student.edad === undefined || student.edad < Number(filters.edadMin))) return false;
  if (filters.edadMax && (student.edad === undefined || student.edad > Number(filters.edadMax))) return false;

  // fechaInscripcion es "AAAA-MM-DD": la comparación lexicográfica de strings ya da orden cronológico.
  if (
    filters.fechaInscripcionDesde &&
    (!student.fechaInscripcion || student.fechaInscripcion < filters.fechaInscripcionDesde)
  ) {
    return false;
  }
  if (
    filters.fechaInscripcionHasta &&
    (!student.fechaInscripcion || student.fechaInscripcion > filters.fechaInscripcionHasta)
  ) {
    return false;
  }

  return true;
}
