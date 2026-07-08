export interface StudentColumnMeta {
  id: string;
  label: string;
  defaultVisible: boolean;
}

/** Full catalog of student data the table can render. "acciones" is always shown and not part of this list. */
export const STUDENT_COLUMN_CATALOG: StudentColumnMeta[] = [
  { id: "foto", label: "Foto", defaultVisible: true },
  { id: "matricula", label: "Matrícula", defaultVisible: true },
  { id: "grupo", label: "Grupo", defaultVisible: true },
  { id: "nombreCompleto", label: "Nombre completo", defaultVisible: true },
  { id: "telefono", label: "Teléfono", defaultVisible: true },
  { id: "universidad", label: "Universidad", defaultVisible: true },
  { id: "edad", label: "Edad", defaultVisible: false },
  { id: "ingresoA", label: "Ingreso a", defaultVisible: false },
  { id: "horario", label: "Horario", defaultVisible: false },
  { id: "gradoEscolar", label: "Grado escolar", defaultVisible: false },
  { id: "tutorNombre", label: "Tutor", defaultVisible: false },
  { id: "tutorTelefono", label: "Teléfono del tutor", defaultVisible: false },
  { id: "direccion", label: "Dirección", defaultVisible: false },
  { id: "fechaInscripcion", label: "Fecha de inscripción", defaultVisible: false },
  { id: "notas", label: "Notas", defaultVisible: false },
];

export const STUDENT_COLUMN_DEFAULT_VISIBILITY: Record<string, boolean> = Object.fromEntries(
  STUDENT_COLUMN_CATALOG.map((column) => [column.id, column.defaultVisible])
);
