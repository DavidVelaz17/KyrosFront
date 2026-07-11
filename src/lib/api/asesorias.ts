"use server";

import { apiFetch } from "@/lib/api/http";
import type { DestinoOption } from "@/lib/api/destinos";

interface AsesoriaDto {
  idAsesoria: number;
  diaAsesoria: string;
  horaAsesoria: string;
}

interface MateriaDto {
  idMateria: number;
  nombreMateria: string;
}

export async function listMaterias(): Promise<DestinoOption[]> {
  const dtos = await apiFetch<MateriaDto[]>("/api/materias");
  return dtos.map((dto) => ({ id: String(dto.idMateria), label: dto.nombreMateria }));
}

/** Busca una Asesoria existente con ese día+hora exactos; si no hay ninguna, la crea.
 *  El catálogo no tiene una restricción de unicidad en (día, hora), así que reutilizamos
 *  la primera coincidencia en vez de crear duplicados innecesarios. */
export async function findOrCreateAsesoria(diaAsesoria: string, horaAsesoria: string): Promise<number> {
  const existentes = await apiFetch<AsesoriaDto[]>("/api/asesorias");
  const match = existentes.find((a) => a.diaAsesoria === diaAsesoria && a.horaAsesoria === horaAsesoria);
  if (match) return match.idAsesoria;

  const creada = await apiFetch<AsesoriaDto>("/api/asesorias", {
    method: "POST",
    body: JSON.stringify({ diaAsesoria, horaAsesoria }),
  });
  return creada.idAsesoria;
}

/** Idempotente en el backend: no falla si la materia ya estaba vinculada a esa asesoría. */
export async function vincularMateriaAsesoria(idAsesoria: number, idMateria: number): Promise<void> {
  await apiFetch<void>(`/api/asesorias/${idAsesoria}/materias/${idMateria}`, { method: "POST" });
}
