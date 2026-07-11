"use server";

import type { CreateStudentInput, Horario, IngresoA, Student } from "@/lib/types/student";
import { apiFetch, apiFetchMultipart } from "@/lib/api/http";
import { todayISODate } from "@/lib/utils/format";

const HORARIO_TO_BACKEND: Record<Horario, string> = {
  Escolarizado: "ESCOLARIZADO",
  Sabatino: "SABATINO",
  Virtual: "VIRTUAL",
};
const HORARIO_FROM_BACKEND: Record<string, Horario> = {
  ESCOLARIZADO: "Escolarizado",
  SABATINO: "Sabatino",
  VIRTUAL: "Virtual",
};

const INGRESO_A_TO_BACKEND: Record<IngresoA, string> = {
  Universidad: "UNIVERSIDAD",
  Bachillerato: "BACHILLERATO",
  Secundaria: "SECUNDARIA",
  Asesorías: "ASESORIAS",
  "Curso de verano": "CURSO_VERANO",
};
const INGRESO_A_FROM_BACKEND: Record<string, IngresoA> = {
  UNIVERSIDAD: "Universidad",
  BACHILLERATO: "Bachillerato",
  SECUNDARIA: "Secundaria",
  ASESORIAS: "Asesorías",
  CURSO_VERANO: "Curso de verano",
};

interface GrupoRefDto {
  idGrupo: number;
}

interface EstudianteDto {
  idEstudiante: number;
  matricula: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  edad: number;
  numeroTelefonico: number;
  escuelaProcedencia: string;
  gradoEscolar: string;
  nombreTutor: string | null;
  telefonoTutor: string | null;
  direccion: string;
  foto: string | null;
  notas: string | null;
  fechaInscripcion: string;
  horario: string;
  ingresoA: string;
  grupo: GrupoRefDto | null;
}

/** El backend guarda solo el path (`/uploads/xxx.ext`); se resuelve aquí a una URL absoluta
 *  para que el cliente no necesite conocer el origen del backend. */
function resolveFotoUrl(foto: string | null): string | null {
  if (!foto) return null;
  return new URL(foto, process.env.BACKEND_API_URL).toString();
}

function toStudent(dto: EstudianteDto): Student {
  return {
    id: String(dto.idEstudiante),
    matricula: dto.matricula,
    ingresoA: INGRESO_A_FROM_BACKEND[dto.ingresoA] ?? "Universidad",
    nombre: dto.nombre,
    apellidoPaterno: dto.apellidoPaterno,
    apellidoMaterno: dto.apellidoMaterno,
    edad: dto.edad,
    telefono: String(dto.numeroTelefonico),
    escuelaProcedencia: dto.escuelaProcedencia,
    gradoEscolar: dto.gradoEscolar,
    tutorNombre: dto.nombreTutor ?? "",
    tutorTelefono: dto.telefonoTutor ?? "",
    direccion: dto.direccion,
    fotoUrl: resolveFotoUrl(dto.foto),
    notas: dto.notas ?? "",
    fechaInscripcion: dto.fechaInscripcion,
    grupoId: dto.grupo ? String(dto.grupo.idGrupo) : "",
    horario: HORARIO_FROM_BACKEND[dto.horario] ?? "Escolarizado",
  };
}

function toForm(input: CreateStudentInput, fechaInscripcion: string) {
  return {
    matricula: input.matricula,
    nombre: input.nombre,
    apellidoPaterno: input.apellidoPaterno,
    apellidoMaterno: input.apellidoMaterno,
    edad: input.edad,
    numeroTelefonico: Number(input.telefono.replace(/\D/g, "")),
    escuelaProcedencia: input.escuelaProcedencia,
    gradoEscolar: input.gradoEscolar,
    nombreTutor: input.tutorNombre || null,
    telefonoTutor: input.tutorTelefono || null,
    direccion: input.direccion,
    foto: null,
    notas: input.notas || null,
    fechaInscripcion,
    horario: HORARIO_TO_BACKEND[input.horario],
    ingresoA: INGRESO_A_TO_BACKEND[input.ingresoA],
    idGrupo: input.grupoId ? Number(input.grupoId) : null,
  };
}

export async function listStudentsByGroup(groupId: string): Promise<Student[]> {
  const dtos = await apiFetch<EstudianteDto[]>(`/api/grupos/${groupId}/estudiantes`);
  return dtos.map(toStudent);
}

export async function listAllStudents(): Promise<Student[]> {
  const dtos = await apiFetch<EstudianteDto[]>("/api/estudiantes");
  return dtos.map(toStudent);
}

export async function getStudent(id: string): Promise<Student | null> {
  try {
    const dto = await apiFetch<EstudianteDto>(`/api/estudiantes/${id}`);
    return toStudent(dto);
  } catch {
    return null;
  }
}

export async function createStudent(input: CreateStudentInput): Promise<Student> {
  const dto = await apiFetch<EstudianteDto>("/api/estudiantes", {
    method: "POST",
    body: JSON.stringify(toForm(input, todayISODate())),
  });
  return toStudent(dto);
}

export async function listExistingMatriculas(): Promise<string[]> {
  const students = await listAllStudents();
  return students.map((student) => student.matricula);
}

/** `formData` debe traer el campo "file" (la foto) y "studentId". */
export async function uploadStudentPhoto(formData: FormData): Promise<Student> {
  const studentId = formData.get("studentId");
  if (typeof studentId !== "string" || !studentId) {
    throw new Error("Falta el id del estudiante para subir la foto.");
  }
  const dto = await apiFetchMultipart<EstudianteDto>(`/api/estudiantes/${studentId}/foto`, formData);
  return toStudent(dto);
}

/** Vincula al alumno con su destino (universidad, bachillerato, secundaria, curso de verano o
 *  asesoría, según su ingresoA) resolviendo contra la tabla puente correcta en el backend.
 *  idCarrera sólo aplica cuando el destino es una Universidad. */
export async function addDestino(studentId: string, idDestino: string, idCarrera?: string): Promise<void> {
  const query = idCarrera ? `?idCarrera=${idCarrera}` : "";
  await apiFetch<void>(`/api/estudiantes/${studentId}/destinos/${idDestino}${query}`, { method: "POST" });
}

export interface StudentDestinoCarrera {
  nombre: string;
  areaNombre: string;
}

export interface StudentDestino {
  id: string;
  destinoId: string;
  nombre: string;
  tipo: IngresoA;
  /** Sólo presente cuando tipo es "Universidad": las carreras que ofrece esa universidad
   *  (vía la tabla puente carrera_universidad), con su área. */
  carreras?: StudentDestinoCarrera[];
}

interface CarreraDto {
  idCarrera: number;
  nombreCarrera: string;
  area: { idArea: number; nombreArea: string } | null;
}

interface EstudianteDestinoDto {
  idRelacion: number;
  idDestino: number;
  nombreDestino: string;
  tipo: string;
  carreras: CarreraDto[] | null;
}

/** Todos los destinos (universidad, bachillerato, secundaria, curso de verano o asesorías)
 *  ligados al alumno. Un alumno puede tener varias asesorías o universidades; los demás tipos, normalmente una. */
export async function getDestinos(studentId: string): Promise<StudentDestino[]> {
  const dtos = await apiFetch<EstudianteDestinoDto[]>(`/api/estudiantes/${studentId}/destinos`);
  return dtos.map((dto) => ({
    id: String(dto.idRelacion),
    destinoId: String(dto.idDestino),
    nombre: dto.nombreDestino,
    tipo: INGRESO_A_FROM_BACKEND[dto.tipo] ?? "Universidad",
    carreras: dto.carreras?.map((carrera) => ({
      nombre: carrera.nombreCarrera,
      areaNombre: carrera.area?.nombreArea ?? "—",
    })),
  }));
}
