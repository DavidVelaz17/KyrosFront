import type { IngresoA } from "@/lib/types/student";

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

// Descripción corta de cada estatus, para mostrar junto al selector/badge donde aparezca y
// evitar que se confundan (ej. "Parcial" vs "Vencido"). Ver components/ui/badge.tsx (prop
// `title`, tooltip nativo) y los selects de estatus en new-cargo-modal.tsx / new-cargo-section.tsx.
export const ESTATUS_CARGO_DESCRIPTIONS: Record<EstatusCargo, string> = {
  PENDIENTE: "Aún no se ha registrado ningún pago sobre este cargo.",
  PARCIAL: "Ya se abonó parte del monto; queda un saldo pendiente por cobrar.",
  PAGADO: "Se cubrió el monto completo del cargo; no queda saldo pendiente.",
  VENCIDO: "Pasó la fecha de vencimiento sin haberse cubierto por completo.",
};

export interface Payment {
  id: string;
  studentId: string;
  /** Solo para mostrar/filtrar en tablas (ej. Pagos): evita tener que cruzar con listAllStudents(). */
  studentNombre: string;
  grupoId: string;
  grupoNombre: string;
  concepto: PaymentConcept;
  tipoMensualidad: PaymentPlanType;
  monto: number;
  metodoPago: PaymentMethod;
  fecha: string;
  notas: string;
  idCargo: string;
  estatusCargo: EstatusCargo;
  /** Quién registró este pago. "—" en pagos creados antes de que se agregara este dato. */
  usuarioNombre: string;
  /** Si el alumno/tutor pidió factura por este pago. Se captura al registrar el pago. */
  requiereFactura: boolean;
  /** IngresoA del alumno al momento de consultar (no del pago en sí); útil para filtrar reportes. */
  ingresoA: IngresoA;
}

// Los campos derivados (studentNombre, grupoNombre, idCargo, estatusCargo, usuarioNombre,
// ingresoA) solo se leen del backend al mostrar pagos; no se piden al crear uno.
export type CreatePaymentInput = Omit<
  Payment,
  "id" | "fecha" | "studentNombre" | "grupoId" | "grupoNombre" | "idCargo" | "estatusCargo" | "usuarioNombre" | "ingresoA"
> & {
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
