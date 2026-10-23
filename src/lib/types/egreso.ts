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
}

export interface CreateEgresoInput {
  tipoId: string;
  importe: number;
  /** Valor de un <input type="datetime-local">: "2026-10-23T10:15". */
  fechaHora: string;
  observaciones: string;
}
