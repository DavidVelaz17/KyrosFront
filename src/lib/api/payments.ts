"use server";

import type { CreatePaymentInput, EstatusCargo, Payment, PaymentConcept, PaymentMethod } from "@/lib/types/payment";
import {
  METODO_PAGO_FROM_BACKEND,
  METODO_PAGO_TO_BACKEND,
  TIPO_MENSUALIDAD_FROM_BACKEND,
  TIPO_MENSUALIDAD_TO_BACKEND,
} from "@/lib/types/payment";
import { INGRESO_A_FROM_BACKEND } from "@/lib/types/student";
import { apiFetch } from "@/lib/api/http";
import { createCargo, listCargosByStudent, type CargoDto } from "@/lib/api/cargos";
import { getSession } from "@/lib/auth/session";
import { todayISODate } from "@/lib/utils/format";

interface PagoUsuarioRef {
  idUsuario: number;
  nombreUsuario: string;
}

interface PagoDto {
  idPago: number;
  montoPagadoPago: number;
  fechaPago: string;
  metodoPago: string;
  cargo: CargoDto;
  usuario: PagoUsuarioRef | null;
  requiereFactura: boolean;
  /** Concepto propio de este pago (p.ej. "Abono a inscripción"). Si es null, el recibo usa
   *  el concepto del cargo (dto.cargo.conceptoCargo). */
  conceptoPago: string | null;
  /** Observaciones capturadas al registrar el pago (se muestran en el recibo). */
  notasPago: string | null;
}

function toPayment(dto: PagoDto): Payment {
  return {
    id: String(dto.idPago),
    studentId: String(dto.cargo.estudiante.idEstudiante),
    studentNombre: `${dto.cargo.estudiante.nombre} ${dto.cargo.estudiante.apellidoPaterno} ${dto.cargo.estudiante.apellidoMaterno}`,
    matricula: dto.cargo.estudiante.matricula,
    grupoId: dto.cargo.estudiante.grupo ? String(dto.cargo.estudiante.grupo.idGrupo) : "",
    grupoNombre: dto.cargo.estudiante.grupo?.nombreGrupo ?? "Sin grupo",
    // El concepto propio del pago (ej. "Abono a inscripción" en un pago parcial) tiene prioridad
    // sobre el concepto del cargo: así el recibo de un abono no muestra el concepto del cargo completo.
    concepto: (dto.conceptoPago || dto.cargo.conceptoCargo || "Otro") as PaymentConcept,
    tipoMensualidad: TIPO_MENSUALIDAD_FROM_BACKEND[dto.cargo.tipoMensualidadCargo] ?? "Pago completo",
    monto: dto.montoPagadoPago,
    metodoPago: METODO_PAGO_FROM_BACKEND[dto.metodoPago] ?? "Efectivo",
    fecha: dto.fechaPago,
    notas: dto.notasPago ?? "",
    idCargo: String(dto.cargo.idCargo),
    estatusCargo: dto.cargo.estatusCargo as EstatusCargo,
    fechaVencimientoCargo: dto.cargo.fechaVencimientoCargo,
    usuarioNombre: dto.usuario?.nombreUsuario ?? "—",
    requiereFactura: dto.requiereFactura,
    ingresoA: dto.cargo.estudiante.ingresoA ? INGRESO_A_FROM_BACKEND[dto.cargo.estudiante.ingresoA] : undefined,
  };
}

export async function getPaymentById(id: string): Promise<Payment> {
  const dto = await apiFetch<PagoDto>(`/api/pagos/${id}`);
  return toPayment(dto);
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

export async function listPaymentsByCargo(idCargo: number): Promise<Payment[]> {
  const dtos = await apiFetch<PagoDto[]>(`/api/pagos/cargo/${idCargo}`);
  return dtos.map(toPayment);
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
      idUsuario: session.idUsuario,
      requiereFactura: input.requiereFactura,
      notasPago: input.notas || null,
    }),
  });

  return toPayment(pagoDto);
}

interface CreatePagoForCargoInput {
  idCargo: number;
  montoPagadoPago: number;
  fechaPago: string;
  metodoPago: PaymentMethod;
  requiereFactura: boolean;
  /** Concepto propio de este pago (ej. abono parcial); si no se manda, el recibo cae al
   *  concepto del cargo. */
  conceptoPago?: string;
  /** Observaciones capturadas al registrar el pago (se muestran en el recibo). */
  notas?: string;
}

/** Registra un pago sobre un cargo ya existente, sin crear uno nuevo (acción rápida "Nuevo pago"). */
export async function createPagoForCargo(input: CreatePagoForCargoInput): Promise<Payment> {
  const session = await getSession();
  if (!session) {
    throw new Error("No hay una sesión activa.");
  }

  const pagoDto = await apiFetch<PagoDto>("/api/pagos", {
    method: "POST",
    body: JSON.stringify({
      montoPagadoPago: input.montoPagadoPago,
      fechaPago: input.fechaPago,
      metodoPago: METODO_PAGO_TO_BACKEND[input.metodoPago],
      idCargo: input.idCargo,
      idUsuario: session.idUsuario,
      requiereFactura: input.requiereFactura,
      conceptoPago: input.conceptoPago || null,
      notasPago: input.notas || null,
    }),
  });

  return toPayment(pagoDto);
}
