import { listCargosByStudent, type CargoDto } from "@/lib/api/cargos";
import { listPaymentsByCargo } from "@/lib/api/payments";

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
const WARNING_WINDOW_DAYS = 3;

/** Nivel de alerta de un cargo pendiente según su fecha de vencimiento: "overdue" si ya venció,
 *  "warning" si vence dentro de WARNING_WINDOW_DAYS días, "none" si falta más o no hay cargo. */
export function cargoAlertLevel(cargo: CargoDto | null): CargoAlertLevel {
  if (!cargo) return "none";
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`);
  const vencimiento = new Date(`${cargo.fechaVencimientoCargo}T00:00:00`);
  const diffDays = Math.round((vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= WARNING_WINDOW_DAYS) return "warning";
  return "none";
}

/** Clases de fondo de fila para cada nivel de alerta, listas para pasarle a StudentsTable. */
export function cargoAlertRowClass(level: CargoAlertLevel): string | undefined {
  if (level === "overdue") return "bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60";
  if (level === "warning") return "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60";
  return undefined;
}
