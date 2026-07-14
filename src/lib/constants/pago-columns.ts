export interface PagoColumnMeta {
  id: string;
  label: string;
  defaultVisible: boolean;
}

/** Full catalog of payment data the table can render. */
export const PAGO_COLUMN_CATALOG: PagoColumnMeta[] = [
  { id: "fecha", label: "Fecha", defaultVisible: true },
  { id: "alumno", label: "Alumno", defaultVisible: true },
  { id: "grupo", label: "Grupo", defaultVisible: true },
  { id: "concepto", label: "Concepto", defaultVisible: true },
  { id: "monto", label: "Monto", defaultVisible: true },
  { id: "metodoPago", label: "Método de pago", defaultVisible: true },
  { id: "usuario", label: "Usuario", defaultVisible: true },
  { id: "requiereFactura", label: "Requiere factura", defaultVisible: true },
  { id: "tipoMensualidad", label: "Tipo de mensualidad", defaultVisible: false },
  { id: "estatusCargo", label: "Estatus del cargo", defaultVisible: false },
];

export const PAGO_COLUMN_DEFAULT_VISIBILITY: Record<string, boolean> = Object.fromEntries(
  PAGO_COLUMN_CATALOG.map((column) => [column.id, column.defaultVisible])
);
