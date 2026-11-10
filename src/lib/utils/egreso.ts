import type { LucideIcon } from "lucide-react";
import { Banknote, Ellipsis, PencilLine, Tag } from "lucide-react";
import type { DestinoOption } from "@/lib/api/destinos";
import type { Egreso, EgresoValores, EstatusEgreso, TipoMovimientoEgreso } from "@/lib/types/egreso";
import { formatCurrency, formatLocalDateTime } from "@/lib/utils/format";

/** Tonos de Badge para los tipos de egreso, asignados por posición en el catálogo: los tipos son
 *  editables desde Catálogos, así que no se puede fijar un color por nombre. */
const TIPO_TONES = ["indigo", "amber", "neutral", "green"] as const;
export type TipoEgresoTone = (typeof TIPO_TONES)[number];

export function tipoEgresoTone(tipoId: string, tipos: DestinoOption[]): TipoEgresoTone {
  const index = tipos.findIndex((tipo) => tipo.id === tipoId);
  return TIPO_TONES[(index < 0 ? 2 : index) % TIPO_TONES.length];
}

/** Ícono de la tarjeta de cada tipo en el modal "Nuevo egreso". Los tipos iniciales tienen el suyo;
 *  uno nuevo agregado desde Catálogos usa una etiqueta genérica. */
export function tipoEgresoIcon(nombre: string): LucideIcon {
  const normalized = nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (normalized.includes("nomina")) return Banknote;
  if (normalized.includes("papeler")) return PencilLine;
  if (normalized === "otro" || normalized === "otros") return Ellipsis;
  return Tag;
}

export const ESTATUS_EGRESO_LABELS: Record<EstatusEgreso, string> = {
  SIN_CAMBIOS: "Sin cambios",
  CORREGIDO: "Corregido",
  ELIMINADO: "Eliminado",
  RESTAURADO: "Restaurado",
};

export const MOVIMIENTO_EGRESO_LABELS: Record<TipoMovimientoEgreso, string> = {
  CORRECCION: "Corregido",
  ELIMINACION: "Eliminado",
  RESTAURACION: "Restaurado",
};

export function estatusEgresoTone(estatus: EstatusEgreso): "neutral" | "amber" | "red" | "green" {
  if (estatus === "CORREGIDO") return "amber";
  if (estatus === "ELIMINADO") return "red";
  if (estatus === "RESTAURADO") return "green";
  return "neutral";
}

/** Fondo de toda la fila según el estatus, con los mismos tonos que el resaltado de alumnos con
 *  cargos vencidos/por vencer (ver cargoAlertRowClass). "Sin cambios" no se resalta. */
export function estatusEgresoRowClass(estatus: EstatusEgreso): string | undefined {
  if (estatus === "ELIMINADO") return "bg-red-200 text-zinc-500 hover:bg-red-300 dark:bg-red-900/60 dark:text-zinc-400 dark:hover:bg-red-900/80";
  if (estatus === "CORREGIDO") return "bg-amber-200 hover:bg-amber-300 dark:bg-amber-900/60 dark:hover:bg-amber-900/80";
  if (estatus === "RESTAURADO") return "bg-emerald-200 hover:bg-emerald-300 dark:bg-emerald-900/60 dark:hover:bg-emerald-900/80";
  return undefined;
}

/** Tooltip del badge de estatus: quién hizo el último cambio, cuándo y por qué. */
export function estatusEgresoTitle(egreso: Egreso): string | undefined {
  const movimiento = egreso.ultimoMovimiento;
  if (!movimiento) return undefined;
  return `${MOVIMIENTO_EGRESO_LABELS[movimiento.tipo]} por ${movimiento.usuarioNombre} el ${formatLocalDateTime(movimiento.fechaHora)}: «${movimiento.justificacion}»`;
}

/** Los eliminados siguen en la tabla, pero no cuentan en totales ni en el reporte. */
export function isEgresoEliminado(egreso: Egreso): boolean {
  return egreso.estatus === "ELIMINADO";
}

export interface EgresoCambio {
  campo: string;
  antes: string;
  despues: string;
}

/** Campos que difieren entre dos versiones de un egreso, ya formateados para mostrarse. La fecha
 *  se compara a nivel minuto: el backend la devuelve con segundos ("…T10:15:00") y el
 *  <input type="datetime-local"> sin ellos ("…T10:15"). */
export function egresoCambios(anterior: EgresoValores, nuevo: EgresoValores): EgresoCambio[] {
  const cambios: EgresoCambio[] = [];
  if (anterior.tipoId !== nuevo.tipoId) {
    cambios.push({ campo: "Tipo", antes: anterior.tipoNombre, despues: nuevo.tipoNombre });
  }
  if (anterior.plantelId !== nuevo.plantelId) {
    cambios.push({ campo: "Plantel", antes: anterior.plantelNombre, despues: nuevo.plantelNombre });
  }
  if (anterior.importe !== nuevo.importe) {
    cambios.push({ campo: "Importe", antes: formatCurrency(anterior.importe), despues: formatCurrency(nuevo.importe) });
  }
  if (anterior.fechaHora.slice(0, 16) !== nuevo.fechaHora.slice(0, 16)) {
    cambios.push({
      campo: "Fecha y hora",
      antes: formatLocalDateTime(anterior.fechaHora),
      despues: formatLocalDateTime(nuevo.fechaHora),
    });
  }
  if (anterior.observaciones.trim() !== nuevo.observaciones.trim()) {
    cambios.push({
      campo: "Observaciones",
      antes: anterior.observaciones.trim() || "—",
      despues: nuevo.observaciones.trim() || "—",
    });
  }
  return cambios;
}
