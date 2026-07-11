// El concepto es texto libre (lo que el usuario escriba), no un catálogo fijo.
export type PaymentConcept = string;

// El backend (MetodoPago) solo soporta estos dos métodos; no existe un equivalente para tarjeta.
export const PAYMENT_METHOD_OPTIONS = ["Efectivo", "Transferencia"] as const;

export type PaymentMethod = (typeof PAYMENT_METHOD_OPTIONS)[number];

export const PAYMENT_PLAN_TYPE_OPTIONS = ["Pago completo", "Bimestral", "Mensualidad", "Por hora"] as const;

export type PaymentPlanType = (typeof PAYMENT_PLAN_TYPE_OPTIONS)[number];

// Coincide 1:1 con el enum EstatusCargo del backend; no requiere traducción.
export const ESTATUS_CARGO_OPTIONS = ["PENDIENTE", "PARCIAL", "PAGADO", "VENCIDO"] as const;

export type EstatusCargo = (typeof ESTATUS_CARGO_OPTIONS)[number];

export interface Payment {
  id: string;
  studentId: string;
  concepto: PaymentConcept;
  tipoMensualidad: PaymentPlanType;
  monto: number;
  metodoPago: PaymentMethod;
  fecha: string;
  notas: string;
}

export type CreatePaymentInput = Omit<Payment, "id" | "fecha"> & {
  fecha?: string;
};

// Mapeos hacia/desde los nombres de enum del backend. Viven aquí (no en lib/api/payments.ts)
// porque un archivo "use server" solo puede exportar funciones async, no objetos planos.
export const TIPO_MENSUALIDAD_TO_BACKEND: Record<PaymentPlanType, string> = {
  "Pago completo": "PAGO_COMPLETO",
  Bimestral: "BIMESTRE",
  Mensualidad: "MENSUALIDAD",
  "Por hora": "POR_HORA",
};

export const TIPO_MENSUALIDAD_FROM_BACKEND: Record<string, PaymentPlanType> = {
  PAGO_COMPLETO: "Pago completo",
  BIMESTRE: "Bimestral",
  MENSUALIDAD: "Mensualidad",
  POR_HORA: "Por hora",
};

export const METODO_PAGO_TO_BACKEND: Record<PaymentMethod, string> = {
  Efectivo: "EFECTIVO",
  Transferencia: "TRANSFERENCIA",
};

export const METODO_PAGO_FROM_BACKEND: Record<string, PaymentMethod> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
};
