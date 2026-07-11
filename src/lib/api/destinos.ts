"use server";

import { apiFetch } from "@/lib/api/http";

export interface DestinoOption {
  id: string;
  label: string;
}

interface UniversidadDto {
  idUniversidad: number;
  nombreUniversidad: string;
}

interface BachilleratoDto {
  idBachillerato: number;
  nombreBachillerato: string;
}

interface SecundariaDto {
  idSecundaria: number;
  nombreSecundaria: string;
}

interface CursoVeranoDto {
  idCursoVerano: number;
  nombreCursoVerano: string;
}

export interface CarreraOption {
  id: string;
  label: string;
  areaNombre: string;
}

interface CarreraDto {
  idCarrera: number;
  nombreCarrera: string;
  area: { idArea: number; nombreArea: string } | null;
}

export async function listUniversidades(): Promise<DestinoOption[]> {
  const dtos = await apiFetch<UniversidadDto[]>("/api/universidades");
  return dtos.map((dto) => ({ id: String(dto.idUniversidad), label: dto.nombreUniversidad }));
}

export async function listCarrerasByUniversidad(idUniversidad: string): Promise<CarreraOption[]> {
  const dtos = await apiFetch<CarreraDto[]>(`/api/universidades/${idUniversidad}/carreras`);
  return dtos.map((dto) => ({
    id: String(dto.idCarrera),
    label: dto.nombreCarrera,
    areaNombre: dto.area?.nombreArea ?? "—",
  }));
}

export async function listBachilleratos(): Promise<DestinoOption[]> {
  const dtos = await apiFetch<BachilleratoDto[]>("/api/bachilleratos");
  return dtos.map((dto) => ({ id: String(dto.idBachillerato), label: dto.nombreBachillerato }));
}

export async function listSecundarias(): Promise<DestinoOption[]> {
  const dtos = await apiFetch<SecundariaDto[]>("/api/secundarias");
  return dtos.map((dto) => ({ id: String(dto.idSecundaria), label: dto.nombreSecundaria }));
}

export async function listCursosVerano(): Promise<DestinoOption[]> {
  const dtos = await apiFetch<CursoVeranoDto[]>("/api/cursos-verano");
  return dtos.map((dto) => ({ id: String(dto.idCursoVerano), label: dto.nombreCursoVerano }));
}
