"use server";

import type { LogEntry } from "@/lib/types/log";
import type { RolUsuario } from "@/lib/types/auth";
import { apiFetch } from "@/lib/api/http";

interface LogUsuarioDto {
  idUsuario: number;
  nombreUsuario: string;
  usuario: string;
  direccionUsuario: string;
  rol: string;
}

interface LogDto {
  idLog: number;
  timeStamp: string;
  usuario: LogUsuarioDto;
}

function toLogEntry(dto: LogDto): LogEntry {
  return {
    id: String(dto.idLog),
    timeStamp: dto.timeStamp,
    usuarioId: String(dto.usuario.idUsuario),
    nombreUsuario: dto.usuario.nombreUsuario,
    usuario: dto.usuario.usuario,
    rol: dto.usuario.rol as RolUsuario,
  };
}

/** Todos los inicios de sesión registrados en el sistema (tabla `log`), más recientes primero. */
export async function listLogs(): Promise<LogEntry[]> {
  const dtos = await apiFetch<LogDto[]>("/api/logs");
  return dtos.map(toLogEntry);
}
