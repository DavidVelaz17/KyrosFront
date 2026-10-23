export interface EgresoColumnMeta {
  id: string;
  label: string;
  defaultVisible: boolean;
}

/** Full catalog of expense data the table can render. */
export const EGRESO_COLUMN_CATALOG: EgresoColumnMeta[] = [
  { id: "fechaHora", label: "Fecha y hora", defaultVisible: true },
  { id: "tipo", label: "Tipo de egreso", defaultVisible: true },
  { id: "importe", label: "Importe", defaultVisible: true },
  { id: "observaciones", label: "Observaciones", defaultVisible: true },
  { id: "usuario", label: "Registrado por", defaultVisible: true },
];

export const EGRESO_COLUMN_DEFAULT_VISIBILITY: Record<string, boolean> = Object.fromEntries(
  EGRESO_COLUMN_CATALOG.map((column) => [column.id, column.defaultVisible])
);
