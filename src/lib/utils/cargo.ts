import { listCargosByStudent, type CargoDto } from "@/lib/api/cargos";
import { listPaymentsByCargo } from "@/lib/api/payments";
import type { EstatusCargo } from "@/lib/types/payment";

/** El cargo pendiente de pago más reciente de una lista (mayor id, ignorando los ya PAGADO):
 *  es "lo próximo que debe" ese alumno. null si no tiene ninguno pendiente. */
export function latestPendingCargo(cargos: CargoDto[]): CargoDto | null {
  const pendientes = cargos.filter((cargo) => cargo.estatusCargo !== "PAGADO");
  if (pendientes.length === 0) return null;
  return pendientes.reduce((latest, cargo) => (cargo.idCargo > latest.idCargo ? cargo : latest));
}

export interface PendingCargo extends CargoDto {
  /** montoTotalCargo menos la suma de los pagos ya registrados sobre ese cargo. */
  montoRestante: number;
}

/** Todos los cargos del alumno con estatus distinto de PAGADO, con su saldo restante ya
 *  calculado (monto total del cargo menos lo que ya se le ha abonado). Usado por todos los
 *  modales de pago que muestran "cargos pendientes" de un alumno (Nuevo pago, Registrar pago). */
export async function fetchPendingCargos(studentId: string): Promise<PendingCargo[]> {
  const cargos = await listCargosByStudent(studentId);
  const pendientes = cargos.filter((cargo) => cargo.estatusCargo !== "PAGADO");
  return Promise.all(
    pendientes.map(async (cargo) => {
      const pagos = await listPaymentsByCargo(cargo.idCargo);
      const pagado = pagos.reduce((sum, pago) => sum + pago.monto, 0);
      // Redondeo a centavos para evitar artefactos de punto flotante (ej. 499.99999999999994).
      const restante = Math.round((cargo.montoTotalCargo - pagado) * 100) / 100;
      return { ...cargo, montoRestante: Math.max(restante, 0) };
    })
  );
}

export type CargoAlertLevel = "none" | "warning" | "overdue";

/** Días antes del vencimiento en los que un cargo pendiente empieza a marcarse en amarillo. */
const WARNING_WINDOW_DAYS = 5;

/** Nivel de alerta de un cargo pendiente según su fecha de vencimiento: "overdue" si ya venció,
 *  "warning" si vence dentro de WARNING_WINDOW_DAYS días, "none" si falta más, ya está PAGADO,
 *  o no hay cargo. Base compartida entre el resaltado de filas (Alumnos) y el tono de los badges
 *  de estatus (Cargos, Pagos), para que ambos usen exactamente la misma ventana de días. */
function alertLevelFromDate(estatusCargo: string, fechaVencimientoCargo: string): CargoAlertLevel {
  if (estatusCargo === "PAGADO") return "none";
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`);
  const vencimiento = new Date(`${fechaVencimientoCargo}T00:00:00`);
  const diffDays = Math.round((vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= WARNING_WINDOW_DAYS) return "warning";
  return "none";
}

export function cargoAlertLevel(cargo: CargoDto | null): CargoAlertLevel {
  if (!cargo) return "none";
  return alertLevelFromDate(cargo.estatusCargo, cargo.fechaVencimientoCargo);
}

/** Clases de fondo de fila para cada nivel de alerta, listas para pasarle a StudentsTable. */
export function cargoAlertRowClass(level: CargoAlertLevel): string | undefined {
  if (level === "overdue") return "bg-red-200 hover:bg-red-300 dark:bg-red-900/60 dark:hover:bg-red-900/80";
  if (level === "warning") return "bg-amber-200 hover:bg-amber-300 dark:bg-amber-900/60 dark:hover:bg-amber-900/80";
  return undefined;
}

/** El estatus a mostrar de un cargo, calculado por fecha en vez de confiar en el estatusCargo
 *  guardado: el backend nunca pasa un cargo a VENCIDO por sí solo al llegar su fecha (ese valor
 *  del enum solo se guarda si alguien lo elige a mano al crear el cargo) — así que si ya pasó la
 *  fecha de vencimiento y no está PAGADO, se muestra como VENCIDO aquí sin importar si el dato
 *  guardado dice PENDIENTE o PARCIAL. PAGADO siempre gana (ya no importa la fecha). */
export function displayEstatusCargo(estatusCargo: EstatusCargo, fechaVencimientoCargo: string): EstatusCargo {
  if (estatusCargo === "PAGADO") return "PAGADO";
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`);
  const vencimiento = new Date(`${fechaVencimientoCargo}T00:00:00`);
  if (vencimiento.getTime() < today.getTime()) return "VENCIDO";
  return estatusCargo;
}

export type CargoBadgeTone = "green" | "amber-bold" | "red" | "neutral";

/** Tono para el badge de estatus de un cargo: además de PAGADO/VENCIDO/PARCIAL, un cargo
 *  PENDIENTE que está por vencer (misma ventana de WARNING_WINDOW_DAYS que el resaltado de
 *  filas de Alumnos) también se pinta en amarillo, como advertencia temprana. */
export function cargoBadgeTone(estatusCargo: EstatusCargo, fechaVencimientoCargo: string): CargoBadgeTone {
  const estatus = displayEstatusCargo(estatusCargo, fechaVencimientoCargo);
  if (estatus === "PAGADO") return "green";
  if (estatus === "VENCIDO") return "red";
  if (estatus === "PARCIAL") return "amber-bold";
  return alertLevelFromDate(estatusCargo, fechaVencimientoCargo) === "warning" ? "amber-bold" : "neutral";
}

export const CARGO_FILTER_STATUS_OPTIONS = ["VENCIDO", "POR_VENCER", "VIGENTE", "PAGADO"] as const;
export type CargoFilterStatus = (typeof CARGO_FILTER_STATUS_OPTIONS)[number];

export const CARGO_FILTER_STATUS_LABELS: Record<CargoFilterStatus, string> = {
  VENCIDO: "Vencidos",
  POR_VENCER: "Por vencer",
  VIGENTE: "Vigentes",
  PAGADO: "Pagados",
};

/** Agrupa un cargo en uno de los 4 grupos del filtro "Estado" de la sección Cargos, calculado
 *  por fecha (igual que cargoBadgeTone/cargoAlertLevel) en vez del estatusCargo guardado:
 *  VENCIDO = ya pasó su fecha y no está pagado; POR_VENCER = vence dentro de la ventana de
 *  advertencia; VIGENTE = todavía le falta más tiempo; PAGADO = ya se cubrió por completo. */
export function cargoFilterStatus(estatusCargo: string, fechaVencimientoCargo: string): CargoFilterStatus {
  if (estatusCargo === "PAGADO") return "PAGADO";
  const level = alertLevelFromDate(estatusCargo, fechaVencimientoCargo);
  if (level === "overdue") return "VENCIDO";
  if (level === "warning") return "POR_VENCER";
  return "VIGENTE";
}
