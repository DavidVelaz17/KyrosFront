"use server";

import type {
  CorregirEgresoInput,
  CreateEgresoInput,
  Egreso,
  EgresoMovimiento,
  EgresoValores,
  EstatusEgreso,
  TipoMovimientoEgreso,
} from "@/lib/types/egreso";
import type { DestinoOption } from "@/lib/api/destinos";
import { apiFetch } from "@/lib/api/http";

interface TipoEgresoDto {
  idTipoEgreso: number;
  nombreTipoEgreso: string;
}

interface PlantelDto {
  idPlantel: number;
  nombrePlantel: string;
}

const SIN_PLANTEL = "Sin plantel";

interface EgresoMovimientoDto {
  idEgresoMovimiento: number;
  tipoMovimiento: TipoMovimientoEgreso;
  fechaHoraMovimiento: string;
  nombreUsuario: string | null;
  justificacionMovimiento: string;
  tipoEgresoAnterior: TipoEgresoDto | null;
  tipoEgresoNuevo: TipoEgresoDto | null;
  importeAnterior: number | null;
  importeNuevo: number | null;
  fechaHoraAnterior: string | null;
  fechaHoraNueva: string | null;
  observacionesAnteriores: string | null;
  observacionesNuevas: string | null;
  plantelAnterior: PlantelDto | null;
  plantelNuevo: PlantelDto | null;
}

interface EgresoDto {
  idEgreso: number;
  tipoEgreso: TipoEgresoDto | null;
  importeEgreso: number;
  fechaHoraEgreso: string;
  observacionesEgreso: string | null;
  idUsuario: number;
  nombreUsuario: string | null;
  plantel: PlantelDto | null;
  estatusEgreso: EstatusEgreso;
  fechaRegistroEgreso: string | null;
  ultimoMovimiento: EgresoMovimientoDto | null;
}

function toValores(
  tipo: TipoEgresoDto | null,
  plantel: PlantelDto | null,
  importe: number | null,
  fechaHora: string | null,
  observaciones: string | null
): EgresoValores | null {
  if (importe === null || fechaHora === null) return null;
  return {
    tipoId: tipo ? String(tipo.idTipoEgreso) : "",
    tipoNombre: tipo?.nombreTipoEgreso ?? "—",
    plantelId: plantel ? String(plantel.idPlantel) : "",
    plantelNombre: plantel?.nombrePlantel ?? SIN_PLANTEL,
    importe,
    fechaHora,
    observaciones: observaciones ?? "",
  };
}

function toMovimiento(dto: EgresoMovimientoDto): EgresoMovimiento {
  return {
    id: String(dto.idEgresoMovimiento),
    tipo: dto.tipoMovimiento,
    fechaHora: dto.fechaHoraMovimiento,
    usuarioNombre: dto.nombreUsuario ?? "—",
    justificacion: dto.justificacionMovimiento,
    anterior: toValores(
      dto.tipoEgresoAnterior,
      dto.plantelAnterior,
      dto.importeAnterior,
      dto.fechaHoraAnterior,
      dto.observacionesAnteriores
    ),
    nuevo: toValores(dto.tipoEgresoNuevo, dto.plantelNuevo, dto.importeNuevo, dto.fechaHoraNueva, dto.observacionesNuevas),
  };
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
    plantelId: dto.plantel ? String(dto.plantel.idPlantel) : "",
    plantelNombre: dto.plantel?.nombrePlantel ?? SIN_PLANTEL,
    estatus: dto.estatusEgreso,
    fechaRegistro: dto.fechaRegistroEgreso,
    ultimoMovimiento: dto.ultimoMovimiento ? toMovimiento(dto.ultimoMovimiento) : null,
  };
}

/** Incluye los eliminados: la tabla los muestra marcados; los totales y el reporte los excluyen. */
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
      idPlantel: Number(input.plantelId),
      importeEgreso: input.importe,
      fechaHoraEgreso: input.fechaHora,
      observacionesEgreso: input.observaciones.trim() || null,
    }),
  });
  return toEgreso(dto);
}

/** Corregir, eliminar y restaurar re-validan la contraseña del usuario en sesión en el backend y
 *  responden el egreso actualizado (con su nuevo estatus) para reemplazarlo en la lista. */
export async function corregirEgreso(id: string, input: CorregirEgresoInput): Promise<Egreso> {
  const dto = await apiFetch<EgresoDto>(`/api/egresos/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      idTipoEgreso: Number(input.tipoId),
      idPlantel: Number(input.plantelId),
      importeEgreso: input.importe,
      fechaHoraEgreso: input.fechaHora,
      observacionesEgreso: input.observaciones.trim() || null,
      justificacion: input.justificacion.trim(),
      password: input.password,
    }),
  });
  return toEgreso(dto);
}

/** No borra el egreso: lo marca como ELIMINADO. */
export async function eliminarEgreso(id: string, justificacion: string, password: string): Promise<Egreso> {
  const dto = await apiFetch<EgresoDto>(`/api/egresos/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ justificacion: justificacion.trim(), password }),
  });
  return toEgreso(dto);
}

export async function restaurarEgreso(id: string, justificacion: string, password: string): Promise<Egreso> {
  const dto = await apiFetch<EgresoDto>(`/api/egresos/${id}/restaurar`, {
    method: "POST",
    body: JSON.stringify({ justificacion: justificacion.trim(), password }),
  });
  return toEgreso(dto);
}

/** Correcciones, eliminaciones y restauraciones del egreso, de la más antigua a la más reciente. */
export async function listEgresoMovimientos(id: string): Promise<EgresoMovimiento[]> {
  const dtos = await apiFetch<EgresoMovimientoDto[]>(`/api/egresos/${id}/movimientos`);
  return dtos.map(toMovimiento);
}

export async function listTiposEgreso(): Promise<DestinoOption[]> {
  const dtos = await apiFetch<TipoEgresoDto[]>("/api/tipos-egreso");
  return dtos.map((dto) => ({ id: String(dto.idTipoEgreso), label: dto.nombreTipoEgreso }));
}
