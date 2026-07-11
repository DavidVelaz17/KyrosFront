"use server";

import type { CreatePaymentInput, Payment, PaymentConcept, PaymentMethod } from "@/lib/types/payment";
import {
  METODO_PAGO_FROM_BACKEND,
  METODO_PAGO_TO_BACKEND,
  TIPO_MENSUALIDAD_FROM_BACKEND,
  TIPO_MENSUALIDAD_TO_BACKEND,
} from "@/lib/types/payment";
import { apiFetch } from "@/lib/api/http";
import { createCargo, listCargosByStudent, type CargoDto } from "@/lib/api/cargos";
import { getSession } from "@/lib/auth/session";
import { todayISODate } from "@/lib/utils/format";

interface PagoDto {
  idPago: number;
  montoPagadoPago: number;
  fechaPago: string;
  metodoPago: string;
  cargo: CargoDto;
}

/**
 * El backend no tiene un campo de notas/observaciones en Cargo ni en Pago, así que
 * las notas capturadas en el modal de pago no se persisten todavía (se pierden al recargar).
 */
function toPayment(dto: PagoDto): Payment {
  return {
    id: String(dto.idPago),
    studentId: String(dto.cargo.estudiante.idEstudiante),
    concepto: (dto.cargo.conceptoCargo ?? "Otro") as PaymentConcept,
    tipoMensualidad: TIPO_MENSUALIDAD_FROM_BACKEND[dto.cargo.tipoMensualidadCargo] ?? "Pago completo",
    monto: dto.montoPagadoPago,
    metodoPago: METODO_PAGO_FROM_BACKEND[dto.metodoPago] ?? "Efectivo",
    fecha: dto.fechaPago,
    notas: "",
  };
}

export async function listPayments(): Promise<Payment[]> {
  const dtos = await apiFetch<PagoDto[]>("/api/pagos");
  return dtos.map(toPayment);
}

export async function listPaymentsByStudent(studentId: string): Promise<Payment[]> {
  const cargos = await listCargosByStudent(studentId);
  const pagosPorCargo = await Promise.all(
    cargos.map((cargo) => apiFetch<PagoDto[]>(`/api/pagos/cargo/${cargo.idCargo}`))
  );
  return pagosPorCargo.flat().map(toPayment);
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const session = await getSession();
  if (!session) {
    throw new Error("No hay una sesión activa.");
  }

  const fecha = input.fecha ?? todayISODate();

  const cargo = await createCargo({
    idEstudiante: Number(input.studentId),
    idUsuario: session.idUsuario,
    tipoMensualidadCargo: TIPO_MENSUALIDAD_TO_BACKEND[input.tipoMensualidad],
    conceptoCargo: input.concepto,
    montoTotalCargo: input.monto,
    fechaVencimientoCargo: fecha,
  });

  const pagoDto = await apiFetch<PagoDto>("/api/pagos", {
    method: "POST",
    body: JSON.stringify({
      montoPagadoPago: input.monto,
      fechaPago: fecha,
      metodoPago: METODO_PAGO_TO_BACKEND[input.metodoPago],
      idCargo: cargo.idCargo,
    }),
  });

  return toPayment(pagoDto);
}

interface CreatePagoForCargoInput {
  idCargo: number;
  montoPagadoPago: number;
  fechaPago: string;
  metodoPago: PaymentMethod;
}

/** Registra un pago sobre un cargo ya existente, sin crear uno nuevo (acción rápida "Nuevo pago"). */
export async function createPagoForCargo(input: CreatePagoForCargoInput): Promise<Payment> {
  const pagoDto = await apiFetch<PagoDto>("/api/pagos", {
    method: "POST",
    body: JSON.stringify({
      montoPagadoPago: input.montoPagadoPago,
      fechaPago: input.fechaPago,
      metodoPago: METODO_PAGO_TO_BACKEND[input.metodoPago],
      idCargo: input.idCargo,
    }),
  });

  return toPayment(pagoDto);
}
