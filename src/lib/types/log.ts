import type { RolUsuario } from "@/lib/types/auth";

/** Un registro de la tabla `log`: se crea uno cada vez que un usuario inicia sesión (ver
 *  AuthService.login en el backend). Los campos del usuario vienen aplanados aquí (en vez de un
 *  objeto anidado) para poder usarlos directo como accessorKey de columna de tabla. */
export interface LogEntry {
  id: string;
  timeStamp: string;
  usuarioId: string;
  nombreUsuario: string;
  usuario: string;
  rol: RolUsuario;
}
