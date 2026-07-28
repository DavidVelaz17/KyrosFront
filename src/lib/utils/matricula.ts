import type { IngresoA } from "@/lib/types/student";

const LEVEL_PREFIX: Record<IngresoA, string> = {
  Universidad: "U",
  Bachillerato: "B",
  Secundaria: "S",
  "Asesorías": "A",
  "Curso de verano": "V",
};

// "Ingresa a" es opcional: sin él no hay de dónde sacar el prefijo, pero la matrícula sigue
// siendo obligatoria y única en la base de datos, así que se usa un prefijo genérico (mismo
// valor que PREFIJO_SIN_INGRESO_A en el backend, ver EstudianteImportExportService).
const PREFIJO_SIN_INGRESO_A = "X";

/** Builds a matricula like "U2026001" from ingresoA + year + sequence. El campo de matrícula en
 *  el formulario de alumno es de solo lectura, así que esta es la única manera en que se asigna. */
export function suggestMatricula(ingresoA: IngresoA | undefined, year: number, sequence: number): string {
  const prefix = levelPrefix(ingresoA);
  return `${prefix}${year}${String(sequence).padStart(3, "0")}`;
}

export function nextSequenceForPrefix(existingMatriculas: string[], prefix: string, year: number): number {
  const pattern = new RegExp(`^${prefix}${year}(\\d{3})$`);
  const usedSequences = existingMatriculas
    .map((matricula) => matricula.match(pattern)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(Number);
  return usedSequences.length > 0 ? Math.max(...usedSequences) + 1 : 1;
}

export function levelPrefix(ingresoA: IngresoA | undefined): string {
  return ingresoA ? LEVEL_PREFIX[ingresoA] : PREFIJO_SIN_INGRESO_A;
}
