"use client";

import { useEffect, useState } from "react";
import type { Student } from "@/lib/types/student";
import { listAllCargos, type CargoDto } from "@/lib/api/cargos";
import { worstCargoAlertLevel, type CargoAlertLevel } from "@/lib/utils/cargo";

/** Para cada alumno, el peor nivel de alerta entre TODOS sus cargos pendientes: "overdue" si
 *  alguno ya venció, "warning" si alguno vence pronto, "none" si no tiene pendientes o a todos
 *  les falta tiempo. Trae todos los cargos en una sola llamada y los agrupa en el cliente, en
 *  vez de una llamada por alumno. */
export function useStudentCargoAlerts(students: Student[]): Record<string, CargoAlertLevel> {
  const [map, setMap] = useState<Record<string, CargoAlertLevel>>({});
  const studentIds = students.map((student) => student.id).join(",");

  useEffect(() => {
    if (!studentIds) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia el mapa cuando no hay alumnos que consultar
      setMap({});
      return;
    }
    let cancelled = false;
    listAllCargos().then((cargos) => {
      if (cancelled) return;
      const byStudent = new Map<string, CargoDto[]>();
      for (const cargo of cargos) {
        const id = String(cargo.estudiante.idEstudiante);
        const list = byStudent.get(id);
        if (list) {
          list.push(cargo);
        } else {
          byStudent.set(id, [cargo]);
        }
      }
      const entries = studentIds
        .split(",")
        .map((id) => [id, worstCargoAlertLevel(byStudent.get(id) ?? [])] as const);
      setMap(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [studentIds]);

  return map;
}
