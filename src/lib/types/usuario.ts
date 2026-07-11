import type { RolUsuario } from "@/lib/types/auth";

export interface Usuario {
  id: string;
  nombreUsuario: string;
  usuario: string;
  direccionUsuario: string;
  rol: RolUsuario;
}

export type CreateUsuarioInput = Omit<Usuario, "id"> & { password: string };
