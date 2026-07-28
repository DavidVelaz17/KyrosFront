/** Filtros disponibles para la tabla de alumnos (secciones "Alumnos" y "Grupos"). Viven en un
 *  solo objeto (en vez de un useState por columna) para que el panel de filtros y el conteo de
 *  "filtros activos" se puedan construir de forma genérica sin enumerar cada campo a mano. */
export interface StudentFilters {
  estatus: string;
  ingresoA: string;
  horario: string;
  universidad: string;
  /** Vacío en la vista de un solo grupo (ahí no aplica: todos los alumnos ya son de ese grupo). */
  grupo: string;
  matricula: string;
  telefono: string;
  gradoEscolar: string;
  tutorNombre: string;
  tutorTelefono: string;
  direccion: string;
  notas: string;
  edadMin: string;
  edadMax: string;
  fechaInscripcionDesde: string;
  fechaInscripcionHasta: string;
}

export const EMPTY_STUDENT_FILTERS: StudentFilters = {
  estatus: "",
  ingresoA: "",
  horario: "",
  universidad: "",
  grupo: "",
  matricula: "",
  telefono: "",
  gradoEscolar: "",
  tutorNombre: "",
  tutorTelefono: "",
  direccion: "",
  notas: "",
  edadMin: "",
  edadMax: "",
  fechaInscripcionDesde: "",
  fechaInscripcionHasta: "",
};

/** Sentinela para "el campo está vacío", distinto de "" (que significa "sin filtro"/todos). Solo
 *  aplica a los selects de campos que ahora son opcionales (ingresoA, horario). */
export const EMPTY_VALUE_FILTER = "__sin_especificar__";

export function countActiveStudentFilters(filters: StudentFilters): number {
  return Object.values(filters).filter((value) => value !== "").length;
}
