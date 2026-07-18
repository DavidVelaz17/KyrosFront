export interface UsuarioColumnMeta {
  id: string;
  label: string;
  defaultVisible: boolean;
}

/** Full catalog of usuario data the table can render. "acciones" is always shown and not part of this list. */
export const USUARIO_COLUMN_CATALOG: UsuarioColumnMeta[] = [
  { id: "usuario", label: "Usuario", defaultVisible: true },
  { id: "nombreUsuario", label: "Nombre", defaultVisible: true },
  { id: "rol", label: "Rol", defaultVisible: true },
  { id: "direccionUsuario", label: "Dirección", defaultVisible: false },
];

export const USUARIO_COLUMN_DEFAULT_VISIBILITY: Record<string, boolean> = Object.fromEntries(
  USUARIO_COLUMN_CATALOG.map((column) => [column.id, column.defaultVisible])
);
