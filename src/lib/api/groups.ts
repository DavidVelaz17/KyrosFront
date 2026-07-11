"use server";

import type { CreateGroupInput, Group } from "@/lib/types/group";
import { apiFetch } from "@/lib/api/http";

interface GrupoDto {
  idGrupo: number;
  nombreGrupo: string;
  fechaInicio: string;
  nombrePlantel: string;
}

function toGroup(dto: GrupoDto): Group {
  return {
    id: String(dto.idGrupo),
    nombre: dto.nombreGrupo,
    fechaInicio: dto.fechaInicio,
    plantel: dto.nombrePlantel,
  };
}

export async function listGroups(): Promise<Group[]> {
  const dtos = await apiFetch<GrupoDto[]>("/api/grupos");
  return dtos.map(toGroup);
}

export async function getGroup(id: string): Promise<Group | null> {
  try {
    const dto = await apiFetch<GrupoDto>(`/api/grupos/${id}`);
    return toGroup(dto);
  } catch {
    return null;
  }
}

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const dto = await apiFetch<GrupoDto>("/api/grupos", {
    method: "POST",
    body: JSON.stringify({
      nombreGrupo: input.nombre,
      fechaInicio: input.fechaInicio,
      nombrePlantel: input.plantel,
    }),
  });
  return toGroup(dto);
}
