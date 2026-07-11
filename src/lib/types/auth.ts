export const ROL_USUARIO_OPTIONS = ["ADMIN", "COORDINADOR", "SECRETARIO", "PROFESOR"] as const;

export type RolUsuario = (typeof ROL_USUARIO_OPTIONS)[number];

export interface SessionUser {
  token: string;
  idUsuario: number;
  nombreUsuario: string;
  usuario: string;
  rol: RolUsuario;
}

/** La pantalla de Profesores (gestión de usuarios rol=PROFESOR) es solo para ADMIN/COORDINADOR. */
export function canManageTeachers(rol: RolUsuario): boolean {
  return rol === "ADMIN" || rol === "COORDINADOR";
}

/** La sección de Usuarios (alta de cualquier rol) es exclusiva del ADMIN. */
export function isAdmin(rol: RolUsuario): boolean {
  return rol === "ADMIN";
}
