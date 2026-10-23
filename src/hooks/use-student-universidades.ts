"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Student } from "@/lib/types/student";
import { studentDestinosQuery } from "@/lib/query/queries";

const NO_APLICA = "No aplica";

/** Resuelve, para cada alumno con ingresoA="Universidad", los nombres de su(s) universidad(es)
 *  ligada(s) (lista vacía si no tiene ninguna). Los alumnos de otros ingresoA no se consultan. */
export function useStudentUniversidades(students: Student[]): Record<string, string[]> {
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

  return useMemo(() => {
    if (!universidadIds || !data) return {};
    return Object.fromEntries(
      Object.entries(data).map(([id, destinos]) => [id, destinos.map((destino) => destino.nombre)] as const)
    );
  }, [data, universidadIds]);
}

/** Nombres de universidad a mostrar para un alumno: ["No aplica"] si su ingresoA no es
 *  Universidad o no tiene ninguna ligada, ["Cargando..."] mientras se resuelve. */
export function resolveStudentUniversidades(student: Student, map: Record<string, string[]>): string[] {
  if (student.ingresoA !== "Universidad") return [NO_APLICA];
  const list = map[student.id];
  if (list === undefined) return ["Cargando..."];
  return list.length > 0 ? list : [NO_APLICA];
}
