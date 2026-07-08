export const PAYMENT_CONCEPT_OPTIONS = [
  "Inscripción",
  "Colegiatura",
  "Material",
  "Examen",
  "Otro",
] as const;

export type PaymentConcept = (typeof PAYMENT_CONCEPT_OPTIONS)[number];

export const PAYMENT_METHOD_OPTIONS = ["Efectivo", "Tarjeta", "Transferencia"] as const;

export type PaymentMethod = (typeof PAYMENT_METHOD_OPTIONS)[number];

export const PAYMENT_PLAN_TYPE_OPTIONS = ["Pago completo", "Bimestral", "Mensualidad", "Por hora"] as const;

export type PaymentPlanType = (typeof PAYMENT_PLAN_TYPE_OPTIONS)[number];

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
