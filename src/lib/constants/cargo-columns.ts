export interface CargoColumnMeta {
  id: string;
  label: string;
  defaultVisible: boolean;
}

/** Full catalog of cargo data the table can render. */
export const CARGO_COLUMN_CATALOG: CargoColumnMeta[] = [
  { id: "alumno", label: "Alumno", defaultVisible: true },
  { id: "matricula", label: "Matrícula", defaultVisible: true },
  { id: "grupo", label: "Grupo", defaultVisible: true },
  { id: "concepto", label: "Concepto", defaultVisible: true },
  { id: "montoTotal", label: "Monto total", defaultVisible: true },
  { id: "fechaVencimiento", label: "Fecha de vencimiento", defaultVisible: true },
  { id: "estatus", label: "Estatus", defaultVisible: true },
  { id: "ingresoA", label: "Ingreso a", defaultVisible: false },
  { id: "tipoMensualidad", label: "Tipo de mensualidad", defaultVisible: false },
  { id: "usuario", label: "Usuario", defaultVisible: false },
];

export const CARGO_COLUMN_DEFAULT_VISIBILITY: Record<string, boolean> = Object.fromEntries(
  CARGO_COLUMN_CATALOG.map((column) => [column.id, column.defaultVisible])
);
