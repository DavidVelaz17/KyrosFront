/** Refleja el último movimiento del egreso. Solo ELIMINADO lo saca de los totales y del reporte. */
export type EstatusEgreso = "SIN_CAMBIOS" | "CORREGIDO" | "ELIMINADO" | "RESTAURADO";

export type TipoMovimientoEgreso = "CORRECCION" | "ELIMINACION" | "RESTAURACION";

/** Valores de un egreso en un punto del tiempo (antes o después de una corrección). */
export interface EgresoValores {
  tipoId: string;
  tipoNombre: string;
  /** "" si no tenía plantel (egresos anteriores a que existiera). */
  plantelId: string;
  plantelNombre: string;
  importe: number;
  fechaHora: string;
  observaciones: string;
}

export interface EgresoMovimiento {
  id: string;
  tipo: TipoMovimientoEgreso;
  /** Hora local de México sin zona, igual que Egreso.fechaHora. */
  fechaHora: string;
  usuarioNombre: string;
  justificacion: string;
  /** Solo en una CORRECCION. */
  anterior: EgresoValores | null;
  nuevo: EgresoValores | null;
}

export interface Egreso {
  id: string;
  tipoId: string;
  tipoNombre: string;
  importe: number;
  /** Hora local de México sin zona, tal como la guarda el backend: "2026-10-23T10:15:00". */
  fechaHora: string;
  observaciones: string;
  usuarioId: string;
  usuarioNombre: string;
  /** "" en egresos registrados antes de que existiera el plantel. */
  plantelId: string;
  plantelNombre: string;
  estatus: EstatusEgreso;
  /** Cuándo se capturó en el sistema; null en los egresos anteriores a esta función. */
  fechaRegistro: string | null;
  /** La última corrección/eliminación/restauración, o null si está SIN_CAMBIOS. */
  ultimoMovimiento: EgresoMovimiento | null;
}

export interface CreateEgresoInput {
  tipoId: string;
  plantelId: string;
  importe: number;
  /** Valor de un <input type="datetime-local">: "2026-10-23T10:15". */
  fechaHora: string;
  observaciones: string;
}

export interface CorregirEgresoInput extends CreateEgresoInput {
  justificacion: string;
  password: string;
}
