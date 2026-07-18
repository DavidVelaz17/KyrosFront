"use server";

import { apiFetch } from "@/lib/api/http";
import type { DestinoOption } from "@/lib/api/destinos";

async function crearCatalogoSimple(path: string, campo: string, idCampo: string, valor: string): Promise<DestinoOption> {
  const dto = await apiFetch<Record<string, string | number>>(path, {
    method: "POST",
    body: JSON.stringify({ [campo]: valor }),
  });
  return { id: String(dto[idCampo]), label: String(dto[campo]) };
}

async function actualizarCatalogoSimple(
  path: string,
  campo: string,
  idCampo: string,
  valor: string
): Promise<DestinoOption> {
  const dto = await apiFetch<Record<string, string | number>>(path, {
    method: "PUT",
    body: JSON.stringify({ [campo]: valor }),
  });
  return { id: String(dto[idCampo]), label: String(dto[campo]) };
}

async function eliminarCatalogo(path: string): Promise<void> {
  await apiFetch<void>(path, { method: "DELETE" });
}

// ---- Áreas (solo lectura aquí: catálogo fijo usado para clasificar carreras) ----
interface AreaDto {
  idArea: number;
  nombreArea: string;
}

export async function listAreas(): Promise<DestinoOption[]> {
  const dtos = await apiFetch<AreaDto[]>("/api/areas");
  return dtos.map((dto) => ({ id: String(dto.idArea), label: dto.nombreArea }));
}

// ---- Universidades ----
export async function createUniversidad(nombre: string): Promise<DestinoOption> {
  return crearCatalogoSimple("/api/universidades", "nombreUniversidad", "idUniversidad", nombre);
}

export async function updateUniversidad(id: string, nombre: string): Promise<DestinoOption> {
  return actualizarCatalogoSimple(`/api/universidades/${id}`, "nombreUniversidad", "idUniversidad", nombre);
}

export async function deleteUniversidad(id: string): Promise<void> {
  return eliminarCatalogo(`/api/universidades/${id}`);
}

// ---- Carreras (pertenecen a un área; se vinculan a universidades aparte) ----
interface CarreraDto {
  idCarrera: number;
  nombreCarrera: string;
  area: { idArea: number; nombreArea: string } | null;
}

export interface Carrera {
  id: string;
  nombre: string;
  areaId: string;
  areaNombre: string;
}

function toCarrera(dto: CarreraDto): Carrera {
  return {
    id: String(dto.idCarrera),
    nombre: dto.nombreCarrera,
    areaId: dto.area ? String(dto.area.idArea) : "",
    areaNombre: dto.area?.nombreArea ?? "—",
  };
}

export async function listCarreras(): Promise<Carrera[]> {
  const dtos = await apiFetch<CarreraDto[]>("/api/carreras");
  return dtos.map(toCarrera);
}

export async function createCarrera(nombre: string, idArea: string): Promise<Carrera> {
  const dto = await apiFetch<CarreraDto>("/api/carreras", {
    method: "POST",
    body: JSON.stringify({ nombreCarrera: nombre, idArea: Number(idArea) }),
  });
  return toCarrera(dto);
}

export async function updateCarrera(id: string, nombre: string, idArea: string): Promise<Carrera> {
  const dto = await apiFetch<CarreraDto>(`/api/carreras/${id}`, {
    method: "PUT",
    body: JSON.stringify({ nombreCarrera: nombre, idArea: Number(idArea) }),
  });
  return toCarrera(dto);
}

export async function deleteCarrera(id: string): Promise<void> {
  return eliminarCatalogo(`/api/carreras/${id}`);
}

export async function vincularCarreraUniversidad(idCarrera: string, idUniversidad: string): Promise<void> {
  await apiFetch<void>(`/api/carreras/${idCarrera}/universidades/${idUniversidad}`, { method: "POST" });
}

export async function desvincularCarreraUniversidad(idCarrera: string, idUniversidad: string): Promise<void> {
  await apiFetch<void>(`/api/carreras/${idCarrera}/universidades/${idUniversidad}`, { method: "DELETE" });
}

// ---- Bachilleratos ----
export async function createBachillerato(nombre: string): Promise<DestinoOption> {
  return crearCatalogoSimple("/api/bachilleratos", "nombreBachillerato", "idBachillerato", nombre);
}

export async function updateBachillerato(id: string, nombre: string): Promise<DestinoOption> {
  return actualizarCatalogoSimple(`/api/bachilleratos/${id}`, "nombreBachillerato", "idBachillerato", nombre);
}

export async function deleteBachillerato(id: string): Promise<void> {
  return eliminarCatalogo(`/api/bachilleratos/${id}`);
}

// ---- Secundarias ----
export async function createSecundaria(nombre: string): Promise<DestinoOption> {
  return crearCatalogoSimple("/api/secundarias", "nombreSecundaria", "idSecundaria", nombre);
}

export async function updateSecundaria(id: string, nombre: string): Promise<DestinoOption> {
  return actualizarCatalogoSimple(`/api/secundarias/${id}`, "nombreSecundaria", "idSecundaria", nombre);
}

export async function deleteSecundaria(id: string): Promise<void> {
  return eliminarCatalogo(`/api/secundarias/${id}`);
}

// ---- Materias ----
export async function createMateria(nombre: string): Promise<DestinoOption> {
  return crearCatalogoSimple("/api/materias", "nombreMateria", "idMateria", nombre);
}

export async function updateMateria(id: string, nombre: string): Promise<DestinoOption> {
  return actualizarCatalogoSimple(`/api/materias/${id}`, "nombreMateria", "idMateria", nombre);
}

export async function deleteMateria(id: string): Promise<void> {
  return eliminarCatalogo(`/api/materias/${id}`);
}

// ---- Cursos de verano ----
export async function createCursoVerano(nombre: string): Promise<DestinoOption> {
  return crearCatalogoSimple("/api/cursos-verano", "nombreCursoVerano", "idCursoVerano", nombre);
}

export async function updateCursoVerano(id: string, nombre: string): Promise<DestinoOption> {
  return actualizarCatalogoSimple(`/api/cursos-verano/${id}`, "nombreCursoVerano", "idCursoVerano", nombre);
}

export async function deleteCursoVerano(id: string): Promise<void> {
  return eliminarCatalogo(`/api/cursos-verano/${id}`);
}
