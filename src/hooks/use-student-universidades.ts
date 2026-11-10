"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Student } from "@/lib/types/student";
import type { StudentDestino } from "@/lib/api/students";
import type { DestinoOption } from "@/lib/api/destinos";
import { carrerasByUniversidadQuery, carrerasQuery, catalogQueries, studentDestinosQuery } from "@/lib/query/queries";

const NO_APLICA = "No aplica";
const EMPTY_UNIVERSIDADES: DestinoOption[] = [];

/** Destinos de los alumnos con ingresoA="Universidad" (los demás no se consultan). Universidades
 *  y carreras salen de la misma consulta, así que pedir ambas no duplica la petición. */
function useUniversidadDestinos(students: Student[]): Record<string, StudentDestino[]> | undefined {
  const universidadIds = students
    .filter((student) => student.ingresoA === "Universidad")
    .map((student) => student.id)
    .join(",");

  // keepPreviousData: si cambia el conjunto de alumnos (ej. se agrega uno), la tabla sigue
  // mostrando las universidades ya conocidas en vez de volver a "Cargando..." mientras llega.
  const { data } = useQuery({
    ...studentDestinosQuery(universidadIds),
    enabled: universidadIds.length > 0,
    placeholderData: keepPreviousData,
  });

  return universidadIds ? data : undefined;
}

/** Resuelve, para cada alumno con ingresoA="Universidad", los nombres de su(s) universidad(es)
 *  ligada(s) (lista vacía si no tiene ninguna). Los alumnos de otros ingresoA no se consultan. */
export function useStudentUniversidades(students: Student[]): Record<string, string[]> {
  const data = useUniversidadDestinos(students);
  return useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(
      Object.entries(data).map(([id, destinos]) => [id, destinos.map((destino) => destino.nombre)] as const)
    );
  }, [data]);
}

/** Como useStudentUniversidades, pero con las carreras que el alumno eligió (de todas sus
 *  universidades, sin repetir). */
export function useStudentCarreras(students: Student[]): Record<string, string[]> {
  const data = useUniversidadDestinos(students);
  return useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(
      Object.entries(data).map(([id, destinos]) => {
        const nombres = destinos.flatMap((destino) => destino.carreras?.map((carrera) => carrera.nombre) ?? []);
        return [id, [...new Set(nombres)]] as const;
      })
    );
  }, [data]);
}

/** Nombres de universidad a mostrar para un alumno: ["No aplica"] si su ingresoA no es
 *  Universidad o no tiene ninguna ligada, ["Cargando..."] mientras se resuelve. */
export function resolveStudentUniversidades(student: Student, map: Record<string, string[]>): string[] {
  if (student.ingresoA !== "Universidad") return [NO_APLICA];
  const list = map[student.id];
  if (list === undefined) return ["Cargando..."];
  return list.length > 0 ? list : [NO_APLICA];
}

/** Igual que resolveStudentUniversidades, para las carreras del alumno. */
export function resolveStudentCarreras(student: Student, map: Record<string, string[]>): string[] {
  return resolveStudentUniversidades(student, map);
}

/** Opciones del filtro "Carrera": si hay una universidad elegida en el filtro, solo las carreras
 *  que ofrece esa universidad; si no, todas las del catálogo. */
export function useCarreraFilterOptions(universidadNombre: string): string[] {
  const { data: universidades = EMPTY_UNIVERSIDADES } = useQuery(catalogQueries.universidades);
  const universidadId = universidades.find((option) => option.label === universidadNombre)?.id ?? "";
  const { data: todas } = useQuery({ ...carrerasQuery(), enabled: !universidadId });
  const { data: deUniversidad } = useQuery({
    ...carrerasByUniversidadQuery(universidadId),
    enabled: universidadId !== "",
  });

  return useMemo(() => {
    const nombres = universidadId
      ? (deUniversidad ?? []).map((carrera) => carrera.label)
      : (todas ?? []).map((carrera) => carrera.nombre);
    return [...new Set(nombres)].sort((a, b) => a.localeCompare(b, "es"));
  }, [universidadId, deUniversidad, todas]);
}
