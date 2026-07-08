export const INGRESO_A_OPTIONS = [
  "Universidad",
  "Bachillerato",
  "Secundaria",
  "Asesorías",
  "Curso de verano",
] as const;

export type IngresoA = (typeof INGRESO_A_OPTIONS)[number];

export const HORARIO_OPTIONS = ["Escolarizado", "Sabatino", "Virtual"] as const;

export type Horario = (typeof HORARIO_OPTIONS)[number];

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
}

export type CreateStudentInput = Omit<Student, "id" | "fechaInscripcion">;

export function studentFullName(student: Pick<Student, "nombre" | "apellidoPaterno" | "apellidoMaterno">) {
  return [student.nombre, student.apellidoPaterno, student.apellidoMaterno]
    .filter(Boolean)
    .join(" ");
}
