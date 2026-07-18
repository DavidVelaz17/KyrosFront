"use server";

import type { CreateUsuarioInput, UpdateUsuarioInput, Usuario } from "@/lib/types/usuario";
import type { RolUsuario } from "@/lib/types/auth";
import { apiFetch } from "@/lib/api/http";

interface UsuarioDto {
  idUsuario: number;
  nombreUsuario: string;
  usuario: string;
  direccionUsuario: string;
  rol: string;
}

function toUsuario(dto: UsuarioDto): Usuario {
  return {
    id: String(dto.idUsuario),
    nombreUsuario: dto.nombreUsuario,
    usuario: dto.usuario,
    direccionUsuario: dto.direccionUsuario,
    rol: dto.rol as RolUsuario,
  };
}

export async function listUsuarios(): Promise<Usuario[]> {
  const dtos = await apiFetch<UsuarioDto[]>("/api/usuarios");
  return dtos.map(toUsuario);
}

export async function createUsuario(input: CreateUsuarioInput): Promise<Usuario> {
  const dto = await apiFetch<UsuarioDto>("/api/usuarios", {
    method: "POST",
    body: JSON.stringify({
      nombreUsuario: input.nombreUsuario,
      usuario: input.usuario,
      password: input.password,
      direccionUsuario: input.direccionUsuario,
      rol: input.rol,
    }),
  });
  return toUsuario(dto);
}

export async function updateUsuario(id: string, input: UpdateUsuarioInput): Promise<Usuario> {
  const dto = await apiFetch<UsuarioDto>(`/api/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      nombreUsuario: input.nombreUsuario,
      usuario: input.usuario,
      direccionUsuario: input.direccionUsuario,
      rol: input.rol,
    }),
  });
  return toUsuario(dto);
}

/** Único camino para cambiar la contraseña de un usuario; no hay endpoint que la muestre. */
export async function resetUsuarioPassword(id: string, nuevaPassword: string): Promise<Usuario> {
  const dto = await apiFetch<UsuarioDto>(`/api/usuarios/${id}/password`, {
    method: "PUT",
    body: JSON.stringify({ nuevaPassword }),
  });
  return toUsuario(dto);
}
