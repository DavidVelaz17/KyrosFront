"use server";

import { apiFetch } from "@/lib/api/http";
import { getSession } from "@/lib/auth/session";

export interface CargoEstudianteRef {
  idEstudiante: number;
  matricula: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  ingresoA: string;
  grupo: { idGrupo: number; nombreGrupo: string } | null;
}

export interface CargoUsuarioRef {
  idUsuario: number;
  nombreUsuario: string;
}

export interface CargoDto {
  idCargo: number;
  tipoMensualidadCargo: string;
  conceptoCargo: string | null;
  montoTotalCargo: number;
  fechaVencimientoCargo: string;
  estatusCargo: string;
  estudiante: CargoEstudianteRef;
  usuario: CargoUsuarioRef;
}

interface CreateCargoInput {
  idEstudiante: number;
  idUsuario: number;
  tipoMensualidadCargo: string;
  conceptoCargo: string;
  montoTotalCargo: number;
  fechaVencimientoCargo: string;
}

/**
 * El backend modela los pagos como Cargo (adeudo) -> Pago (abono), ambos inmutables.
 * Para el flujo simple de "registrar pago" del front, se crea un cargo ya PAGADO por
 * el monto completo y luego el pago que lo salda (ver createPayment en payments.ts).
 */
export async function createCargo(input: CreateCargoInput): Promise<CargoDto> {
  return apiFetch<CargoDto>("/api/cargos", {
    method: "POST",
    body: JSON.stringify({
      tipoMensualidadCargo: input.tipoMensualidadCargo,
      conceptoCargo: input.conceptoCargo,
      montoTotalCargo: input.montoTotalCargo,
      fechaVencimientoCargo: input.fechaVencimientoCargo,
      estatusCargo: "PAGADO",
      idEstudiante: input.idEstudiante,
      idUsuario: input.idUsuario,
    }),
  });
}

export async function listCargosByStudent(idEstudiante: string): Promise<CargoDto[]> {
  return apiFetch<CargoDto[]>(`/api/cargos/estudiante/${idEstudiante}`);
}

export async function listAllCargos(): Promise<CargoDto[]> {
  return apiFetch<CargoDto[]>("/api/cargos");
}

/** El resto del cargo es inmutable; solo su estatus puede transicionar (ej. al registrar un pago). */
export async function updateCargoEstatus(idCargo: number, estatusCargo: string): Promise<CargoDto> {
  return apiFetch<CargoDto>(`/api/cargos/${idCargo}/estatus`, {
    method: "PUT",
    body: JSON.stringify({ estatusCargo }),
  });
}

interface CreateCargoStandaloneInput {
  idEstudiante: string;
  tipoMensualidadCargo: string;
  conceptoCargo: string;
  montoTotalCargo: number;
  fechaVencimientoCargo: string;
  estatusCargo: string;
}

/** Crea un cargo (adeudo) con el estatus que se indique, para la acción rápida "Nuevo cargo". */
export async function createCargoStandalone(input: CreateCargoStandaloneInput): Promise<CargoDto> {
  const session = await getSession();
  if (!session) {
    throw new Error("No hay una sesión activa.");
  }

  return apiFetch<CargoDto>("/api/cargos", {
    method: "POST",
    body: JSON.stringify({
      tipoMensualidadCargo: input.tipoMensualidadCargo,
      conceptoCargo: input.conceptoCargo,
      montoTotalCargo: input.montoTotalCargo,
      fechaVencimientoCargo: input.fechaVencimientoCargo,
      estatusCargo: input.estatusCargo,
      idEstudiante: Number(input.idEstudiante),
      idUsuario: session.idUsuario,
    }),
  });
}
