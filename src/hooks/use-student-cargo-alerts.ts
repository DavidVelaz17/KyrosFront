"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Student } from "@/lib/types/student";
import type { CargoDto } from "@/lib/api/cargos";
import { cargosQuery } from "@/lib/query/queries";
import { worstCargoAlertLevel, type CargoAlertLevel } from "@/lib/utils/cargo";

/** Para cada alumno, el peor nivel de alerta entre TODOS sus cargos pendientes: "overdue" si
 *  alguno ya venció, "warning" si alguno vence pronto, "none" si no tiene pendientes o a todos
 *  les falta tiempo. Usa la lista completa de cargos (la misma consulta cacheada que la pantalla
 *  de Cargos) y la agrupa en el cliente, en vez de una llamada por alumno. */
export function useStudentCargoAlerts(students: Student[]): Record<string, CargoAlertLevel> {
  const studentIds = students.map((student) => student.id).join(",");
  const { data: cargos } = useQuery({ ...cargosQuery(), enabled: studentIds.length > 0 });

  return useMemo(() => {
    if (!studentIds || !cargos) return {};
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
    const entries = studentIds.split(",").map((id) => [id, worstCargoAlertLevel(byStudent.get(id) ?? [])] as const);
    return Object.fromEntries(entries);
  }, [cargos, studentIds]);
}
