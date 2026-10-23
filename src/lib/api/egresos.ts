"use server";

import type { CreateEgresoInput, Egreso } from "@/lib/types/egreso";
import type { DestinoOption } from "@/lib/api/destinos";
import { apiFetch } from "@/lib/api/http";

interface TipoEgresoDto {
  idTipoEgreso: number;
  nombreTipoEgreso: string;
}

interface EgresoDto {
  idEgreso: number;
  tipoEgreso: TipoEgresoDto | null;
  importeEgreso: number;
  fechaHoraEgreso: string;
  observacionesEgreso: string | null;
  idUsuario: number;
  nombreUsuario: string | null;
}

function toEgreso(dto: EgresoDto): Egreso {
  return {
    id: String(dto.idEgreso),
    tipoId: dto.tipoEgreso ? String(dto.tipoEgreso.idTipoEgreso) : "",
    tipoNombre: dto.tipoEgreso?.nombreTipoEgreso ?? "—",
    importe: dto.importeEgreso,
    fechaHora: dto.fechaHoraEgreso,
    observaciones: dto.observacionesEgreso ?? "",
    usuarioId: String(dto.idUsuario),
    usuarioNombre: dto.nombreUsuario ?? "—",
  };
}

export async function listEgresos(): Promise<Egreso[]> {
  const dtos = await apiFetch<EgresoDto[]>("/api/egresos");
  return dtos.map(toEgreso);
}

/** Quién lo registra no se manda: el backend lo toma del usuario autenticado (ver EgresoService). */
export async function createEgreso(input: CreateEgresoInput): Promise<Egreso> {
  const dto = await apiFetch<EgresoDto>("/api/egresos", {
    method: "POST",
    body: JSON.stringify({
      idTipoEgreso: Number(input.tipoId),
      importeEgreso: input.importe,
      fechaHoraEgreso: input.fechaHora,
      observacionesEgreso: input.observaciones.trim() || null,
    }),
  });
  return toEgreso(dto);
}

export async function listTiposEgreso(): Promise<DestinoOption[]> {
  const dtos = await apiFetch<TipoEgresoDto[]>("/api/tipos-egreso");
  return dtos.map((dto) => ({ id: String(dto.idTipoEgreso), label: dto.nombreTipoEgreso }));
}
