import type { IngresoA } from "@/lib/types/student";

const LEVEL_PREFIX: Record<IngresoA, string> = {
  Universidad: "U",
  Bachillerato: "B",
  Secundaria: "S",
  "Asesorías": "A",
  "Curso de verano": "V",
};

/** Builds a matricula like "U2026001" from ingresoA + year + sequence. Editable by the user afterwards. */
export function suggestMatricula(ingresoA: IngresoA, year: number, sequence: number): string {
  const prefix = LEVEL_PREFIX[ingresoA];
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

export function levelPrefix(ingresoA: IngresoA): string {
  return LEVEL_PREFIX[ingresoA];
}
