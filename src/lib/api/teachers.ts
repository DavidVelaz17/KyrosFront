"use server";

import type { CreateTeacherInput, Teacher, UpdateTeacherInput } from "@/lib/types/teacher";
import { apiFetch } from "@/lib/api/http";

const ROL_PROFESOR = "PROFESOR";

/**
 * `UsuarioForm.password` es obligatoria también para actualizar, pero
 * `UsuarioService.updateUsuario` nunca la lee ni la persiste — es un campo de
 * validación "muerto" en el update. Se manda un relleno fijo solo para pasar
 * esa validación, sin inventar ni exponer una contraseña real.
 */
const PASSWORD_PLACEHOLDER_EN_UPDATE = "________";

interface UsuarioDto {
  idUsuario: number;
  nombreUsuario: string;
  usuario: string;
  direccionUsuario: string;
  rol: string;
}

function toTeacher(dto: UsuarioDto): Teacher {
  return {
    id: String(dto.idUsuario),
    nombreUsuario: dto.nombreUsuario,
    usuario: dto.usuario,
    direccionUsuario: dto.direccionUsuario,
  };
}

export async function listTeachers(): Promise<Teacher[]> {
  const dtos = await apiFetch<UsuarioDto[]>("/api/usuarios");
  return dtos.filter((dto) => dto.rol === ROL_PROFESOR).map(toTeacher);
}

export async function getTeacher(id: string): Promise<Teacher | null> {
  try {
    const dto = await apiFetch<UsuarioDto>(`/api/usuarios/${id}`);
    return dto.rol === ROL_PROFESOR ? toTeacher(dto) : null;
  } catch {
    return null;
  }
}

export async function createTeacher(input: CreateTeacherInput): Promise<Teacher> {
  const dto = await apiFetch<UsuarioDto>("/api/usuarios", {
    method: "POST",
    body: JSON.stringify({
      nombreUsuario: input.nombreUsuario,
      usuario: input.usuario,
      password: input.password,
      direccionUsuario: input.direccionUsuario,
      rol: ROL_PROFESOR,
    }),
  });
  return toTeacher(dto);
}

export async function updateTeacher(id: string, input: UpdateTeacherInput): Promise<Teacher> {
  const dto = await apiFetch<UsuarioDto>(`/api/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      nombreUsuario: input.nombreUsuario,
      usuario: input.usuario,
      password: PASSWORD_PLACEHOLDER_EN_UPDATE,
      direccionUsuario: input.direccionUsuario,
      rol: ROL_PROFESOR,
    }),
  });
  return toTeacher(dto);
}

export async function resetTeacherPassword(id: string, nuevaPassword: string): Promise<Teacher> {
  const dto = await apiFetch<UsuarioDto>(`/api/usuarios/${id}/password`, {
    method: "PUT",
    body: JSON.stringify({ nuevaPassword }),
  });
  return toTeacher(dto);
}
