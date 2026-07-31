"use server";

import type { CreateStudentInput, EstatusEstudiante, Horario, IngresoA, Student } from "@/lib/types/student";
import { INGRESO_A_FROM_BACKEND, INGRESO_A_TO_BACKEND } from "@/lib/types/student";
import { apiFetch, apiFetchBlob, apiFetchMultipart } from "@/lib/api/http";

const ESTATUS_TO_BACKEND: Record<EstatusEstudiante, string> = {
  Activo: "ACTIVO",
  Baja: "BAJA",
};
const ESTATUS_FROM_BACKEND: Record<string, EstatusEstudiante> = {
  ACTIVO: "Activo",
  BAJA: "Baja",
};

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

interface GrupoRefDto {
  idGrupo: number;
}

interface EstudianteDto {
  idEstudiante: number;
  matricula: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  edad: number | null;
  numeroTelefonico: number | null;
  escuelaProcedencia: string | null;
  gradoEscolar: string | null;
  nombreTutor: string | null;
  telefonoTutor: string | null;
  direccion: string | null;
  foto: string | null;
  notas: string | null;
  fechaInscripcion: string | null;
  horario: string | null;
  ingresoA: string | null;
  grupo: GrupoRefDto | null;
  estatus: string;
  llevaIngles: boolean;
}

/** El backend guarda solo el path (`/uploads/xxx.ext`). En dev local, frontend y backend viven en
 *  orígenes distintos (ej. localhost:3000 vs 192.168.1.148:8080), así que hace falta construir la
 *  URL absoluta contra PHOTOS_PUBLIC_BASE_URL para que el navegador la pueda cargar. Detrás de un
 *  reverse proxy que sirve todo bajo un solo dominio (producción, ver Caddyfile en kyros-deploy:
 *  /uploads/* se enruta al backend), NO hay que setear esa variable: la ruta relativa que manda
 *  el backend ya resuelve sola contra el dominio público — construir la absoluta ahí terminaría
 *  usando BACKEND_API_URL, que en Docker apunta al hostname interno "backend" (solo resoluble
 *  dentro de la red de contenedores, no desde el navegador del usuario). */
function resolveFotoUrl(foto: string | null): string | null {
  if (!foto) return null;
  const publicBase = process.env.PHOTOS_PUBLIC_BASE_URL;
  return publicBase ? new URL(foto, publicBase).toString() : foto;
}

function toStudent(dto: EstudianteDto): Student {
  return {
    id: String(dto.idEstudiante),
    matricula: dto.matricula,
    ingresoA: dto.ingresoA ? INGRESO_A_FROM_BACKEND[dto.ingresoA] : undefined,
    nombre: dto.nombre,
    apellidoPaterno: dto.apellidoPaterno,
    apellidoMaterno: dto.apellidoMaterno,
    edad: dto.edad ?? undefined,
    telefono: dto.numeroTelefonico != null ? String(dto.numeroTelefonico) : "",
    escuelaProcedencia: dto.escuelaProcedencia ?? "",
    gradoEscolar: dto.gradoEscolar ?? undefined,
    tutorNombre: dto.nombreTutor ?? "",
    tutorTelefono: dto.telefonoTutor ?? "",
    direccion: dto.direccion ?? undefined,
    fotoUrl: resolveFotoUrl(dto.foto),
    notas: dto.notas ?? "",
    fechaInscripcion: dto.fechaInscripcion ?? undefined,
    grupoId: dto.grupo ? String(dto.grupo.idGrupo) : "",
    horario: dto.horario ? HORARIO_FROM_BACKEND[dto.horario] : undefined,
    estatus: ESTATUS_FROM_BACKEND[dto.estatus] ?? "Activo",
    llevaIngles: dto.llevaIngles,
  };
}

function toForm(input: CreateStudentInput) {
  return {
    matricula: input.matricula,
    nombre: input.nombre,
    apellidoPaterno: input.apellidoPaterno,
    apellidoMaterno: input.apellidoMaterno,
    edad: input.edad ?? null,
    numeroTelefonico: input.telefono ? Number(input.telefono.replace(/\D/g, "")) : null,
    escuelaProcedencia: input.escuelaProcedencia || null,
    gradoEscolar: input.gradoEscolar || null,
    nombreTutor: input.tutorNombre || null,
    telefonoTutor: input.tutorTelefono || null,
    direccion: input.direccion || null,
    foto: null,
    notas: input.notas || null,
    fechaInscripcion: input.fechaInscripcion || null,
    horario: input.horario ? HORARIO_TO_BACKEND[input.horario] : null,
    ingresoA: input.ingresoA ? INGRESO_A_TO_BACKEND[input.ingresoA] : null,
    idGrupo: input.grupoId ? Number(input.grupoId) : null,
    llevaIngles: input.llevaIngles,
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
    body: JSON.stringify(toForm(input)),
  });
  return toStudent(dto);
}

export async function updateStudent(id: string, input: CreateStudentInput): Promise<Student> {
  const dto = await apiFetch<EstudianteDto>(`/api/estudiantes/${id}`, {
    method: "PUT",
    body: JSON.stringify(toForm(input)),
  });
  return toStudent(dto);
}

/** Cambia el estatus del alumno (Activo/Baja). "Dar de baja" usa esto en vez de borrar al
 *  alumno: el registro y su historial (pagos, destinos, etc.) se conservan. */
export async function updateStudentEstatus(id: string, estatus: EstatusEstudiante): Promise<Student> {
  const dto = await apiFetch<EstudianteDto>(`/api/estudiantes/${id}/estatus`, {
    method: "PUT",
    body: JSON.stringify({ estatus: ESTATUS_TO_BACKEND[estatus] }),
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

export interface ImportStudentsError {
  fila: number;
  mensaje: string;
}

export interface ImportStudentsResult {
  totalFilas: number;
  exitosos: number;
  errores: ImportStudentsError[];
}

/** `formData` debe traer el campo "file" (el .xlsx). Una fila inválida no aborta el lote: se
 *  reporta en `errores` junto con las demás filas que sí se hayan importado bien. */
export async function importStudentsExcel(formData: FormData): Promise<ImportStudentsResult> {
  return apiFetchMultipart<ImportStudentsResult>("/api/estudiantes/importar", formData);
}

/** Devuelve los bytes de un .xlsx con todos los alumnos y su información relacionada (cargos,
 *  pagos, destinos); el caller (siempre un componente cliente) arma el Blob y dispara la
 *  descarga en el navegador. */
export async function exportStudentsExcel(): Promise<ArrayBuffer> {
  return apiFetchBlob("/api/estudiantes/exportar");
}

/** Devuelve los bytes de un .xlsx vacío con los encabezados exactos que espera importStudentsExcel. */
export async function downloadStudentsTemplate(): Promise<ArrayBuffer> {
  return apiFetchBlob("/api/estudiantes/plantilla");
}

/** Vincula al alumno con su destino (universidad, bachillerato, secundaria, curso de verano o
 *  asesoría, según su ingresoA) resolviendo contra la tabla puente correcta en el backend.
 *  idCarrera sólo aplica cuando el destino es una Universidad. */
export async function addDestino(studentId: string, idDestino: string, idCarrera?: string): Promise<void> {
  const query = idCarrera ? `?idCarrera=${idCarrera}` : "";
  await apiFetch<void>(`/api/estudiantes/${studentId}/destinos/${idDestino}${query}`, { method: "POST" });
}

/** Desvincula al alumno de un destino ya asignado (resuelto contra la tabla puente correcta
 *  según su ingresoA actual en el backend). Usar antes de cambiar el ingresoA del alumno. */
export async function removeDestino(studentId: string, idDestino: string): Promise<void> {
  await apiFetch<void>(`/api/estudiantes/${studentId}/destinos/${idDestino}`, { method: "DELETE" });
}

export interface StudentDestinoCarrera {
  carreraId: string;
  nombre: string;
  areaNombre: string;
}

export interface StudentDestinoMateria {
  id: string;
  nombre: string;
}

export interface StudentDestino {
  id: string;
  destinoId: string;
  nombre: string;
  tipo: IngresoA;
  /** Sólo presente cuando tipo es "Universidad": las carreras que ofrece esa universidad
   *  (vía la tabla puente carrera_universidad), con su área. */
  carreras?: StudentDestinoCarrera[];
  /** Sólo presente cuando tipo es "Asesorías": las materias vinculadas a esa asesoría. */
  materias?: StudentDestinoMateria[];
  /** Sólo presente cuando tipo es "Asesorías": día y hora de la asesoría (códigos del backend). */
  dia?: string;
  hora?: string;
}

interface CarreraDto {
  idCarrera: number;
  nombreCarrera: string;
  area: { idArea: number; nombreArea: string } | null;
}

interface MateriaDto {
  idMateria: number;
  nombreMateria: string;
}

interface EstudianteDestinoDto {
  idRelacion: number;
  idDestino: number;
  nombreDestino: string;
  tipo: string;
  carreras: CarreraDto[] | null;
  materias: MateriaDto[] | null;
  dia: string | null;
  hora: string | null;
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
      carreraId: String(carrera.idCarrera),
      nombre: carrera.nombreCarrera,
      areaNombre: carrera.area?.nombreArea ?? "—",
    })),
    materias: dto.materias?.map((materia) => ({ id: String(materia.idMateria), nombre: materia.nombreMateria })),
    dia: dto.dia ?? undefined,
    hora: dto.hora ?? undefined,
  }));
}
