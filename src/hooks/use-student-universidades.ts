"use client";

import { useEffect, useState } from "react";
import type { Student } from "@/lib/types/student";
import { getDestinos } from "@/lib/api/students";

const NO_APLICA = "No aplica";

/** Resuelve, para cada alumno con ingresoA="Universidad", los nombres de su(s) universidad(es)
 *  ligada(s) (lista vacía si no tiene ninguna). Los alumnos de otros ingresoA no se consultan. */
export function useStudentUniversidades(students: Student[]): Record<string, string[]> {
  const [map, setMap] = useState<Record<string, string[]>>({});
  const universidadIds = students
    .filter((student) => student.ingresoA === "Universidad")
    .map((student) => student.id)
    .join(",");

  useEffect(() => {
    if (!universidadIds) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia el mapa cuando no hay alumnos de Universidad que consultar
      setMap({});
      return;
    }
    let cancelled = false;
    const ids = universidadIds.split(",");
    Promise.all(
      ids.map((id) => getDestinos(id).then((destinos) => [id, destinos.map((destino) => destino.nombre)] as const))
    ).then((entries) => {
      if (cancelled) return;
      setMap(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [universidadIds]);

  return map;
}

/** Nombres de universidad a mostrar para un alumno: ["No aplica"] si su ingresoA no es
 *  Universidad o no tiene ninguna ligada, ["Cargando..."] mientras se resuelve. */
export function resolveStudentUniversidades(student: Student, map: Record<string, string[]>): string[] {
  if (student.ingresoA !== "Universidad") return [NO_APLICA];
  const list = map[student.id];
  if (list === undefined) return ["Cargando..."];
  return list.length > 0 ? list : [NO_APLICA];
}
