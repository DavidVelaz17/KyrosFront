"use server";

import type { CreateUsuarioInput, Usuario } from "@/lib/types/usuario";
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
