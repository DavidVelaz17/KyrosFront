export const INGRESO_A_OPTIONS = [
  "Universidad",
  "Bachillerato",
  "Secundaria",
  "Asesorías",
  "Curso de verano",
] as const;

export type IngresoA = (typeof INGRESO_A_OPTIONS)[number];

// Mapeos hacia/desde los nombres de enum del backend. Viven aquí (no en lib/api/students.ts)
// porque un archivo "use server" solo puede exportar funciones async, no objetos planos.
export const INGRESO_A_TO_BACKEND: Record<IngresoA, string> = {
  Universidad: "UNIVERSIDAD",
  Bachillerato: "BACHILLERATO",
  Secundaria: "SECUNDARIA",
  Asesorías: "ASESORIAS",
  "Curso de verano": "CURSO_VERANO",
};

export const INGRESO_A_FROM_BACKEND: Record<string, IngresoA> = {
  UNIVERSIDAD: "Universidad",
  BACHILLERATO: "Bachillerato",
  SECUNDARIA: "Secundaria",
  ASESORIAS: "Asesorías",
  CURSO_VERANO: "Curso de verano",
};

export const HORARIO_OPTIONS = ["Escolarizado", "Sabatino", "Virtual"] as const;

export type Horario = (typeof HORARIO_OPTIONS)[number];

export const ESTATUS_ESTUDIANTE_OPTIONS = ["Activo", "Baja"] as const;

export type EstatusEstudiante = (typeof ESTATUS_ESTUDIANTE_OPTIONS)[number];

export interface Student {
  id: string;
  matricula: string;
  ingresoA: IngresoA;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  edad: number;
  telefono: string;
  escuelaProcedencia: string;
  gradoEscolar: string;
  tutorNombre: string;
  tutorTelefono: string;
  direccion: string;
  fotoUrl: string | null;
  notas: string;
  fechaInscripcion: string;
  grupoId: string;
  horario: Horario;
  estatus: EstatusEstudiante;
}

// El estatus no se asigna a mano al crear/editar: nace en "Activo" y solo cambia vía la
// acción dedicada "Dar de baja" (ver updateStudentEstatus en lib/api/students.ts).
export type CreateStudentInput = Omit<Student, "id" | "estatus">;

export function studentFullName(student: Pick<Student, "nombre" | "apellidoPaterno" | "apellidoMaterno">) {
  return [student.nombre, student.apellidoPaterno, student.apellidoMaterno]
    .filter(Boolean)
    .join(" ");
}
