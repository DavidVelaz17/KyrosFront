import { queryOptions, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { getGroup, listGroups } from "@/lib/api/groups";
import { getDestinosForStudents, listAllStudents, listStudentsByGroup } from "@/lib/api/students";
import { listPayments } from "@/lib/api/payments";
import { listAllCargos } from "@/lib/api/cargos";
import { listCampuses } from "@/lib/api/campuses";
import {
  listBachilleratos,
  listCarrerasByUniversidad,
  listCursosVerano,
  listSecundarias,
  listUniversidades,
} from "@/lib/api/destinos";
import { listMaterias } from "@/lib/api/asesorias";
import { listTeachers } from "@/lib/api/teachers";
import { listUsuarios } from "@/lib/api/usuarios";
import { listLogs } from "@/lib/api/logs";

// Todas las queryFn envuelven a la Server Action en una flecha sin argumentos: si se pasara la
// Server Action directo, TanStack le mandaría su contexto ({ signal, queryKey, ... }) como
// argumento y Next intentaría serializarlo (AbortSignal no es serializable) para mandarlo al
// servidor.

/** Datos sensibles (cuentas del personal, bitácora de accesos): se cachean solo en memoria
 *  mientras la pestaña está abierta, nunca en el disco del equipo. Ver QueryProvider. */
const MEMORY_ONLY = { persist: false } as const;

export const queryKeys = {
  groups: ["groups"] as const,
  group: (id: string) => ["groups", id] as const,
  students: ["students"] as const,
  allStudents: ["students", "all"] as const,
  studentsByGroup: (groupId: string) => ["students", "group", groupId] as const,
  studentDestinos: (ids: string) => ["students", "destinos", ids] as const,
  payments: ["payments"] as const,
  cargos: ["cargos"] as const,
  campuses: ["campuses"] as const,
  catalogos: ["catalogos"] as const,
  teachers: ["teachers"] as const,
  usuarios: ["usuarios"] as const,
  logs: ["logs"] as const,
};

export const groupsQuery = () => queryOptions({ queryKey: queryKeys.groups, queryFn: () => listGroups() });

export const groupQuery = (id: string) => queryOptions({ queryKey: queryKeys.group(id), queryFn: () => getGroup(id) });

export const allStudentsQuery = () =>
  queryOptions({ queryKey: queryKeys.allStudents, queryFn: () => listAllStudents() });

export const studentsByGroupQuery = (groupId: string) =>
  queryOptions({ queryKey: queryKeys.studentsByGroup(groupId), queryFn: () => listStudentsByGroup(groupId) });

/** Destinos de varios alumnos en una sola Server Action (ver getDestinosForStudents). `ids` va
 *  como string ya unido por comas para que la llave sea estable entre renders. */
export const studentDestinosQuery = (ids: string) =>
  queryOptions({
    queryKey: queryKeys.studentDestinos(ids),
    queryFn: () => getDestinosForStudents(ids ? ids.split(",") : []),
  });

export const paymentsQuery = () => queryOptions({ queryKey: queryKeys.payments, queryFn: () => listPayments() });

export const cargosQuery = () => queryOptions({ queryKey: queryKeys.cargos, queryFn: () => listAllCargos() });

export const campusesQuery = () => queryOptions({ queryKey: queryKeys.campuses, queryFn: () => listCampuses() });

export const catalogQueries = {
  universidades: queryOptions({ queryKey: ["catalogos", "universidades"], queryFn: () => listUniversidades() }),
  bachilleratos: queryOptions({ queryKey: ["catalogos", "bachilleratos"], queryFn: () => listBachilleratos() }),
  secundarias: queryOptions({ queryKey: ["catalogos", "secundarias"], queryFn: () => listSecundarias() }),
  cursosVerano: queryOptions({ queryKey: ["catalogos", "cursos-verano"], queryFn: () => listCursosVerano() }),
  materias: queryOptions({ queryKey: ["catalogos", "materias"], queryFn: () => listMaterias() }),
};

export type CatalogQuery = (typeof catalogQueries)[keyof typeof catalogQueries];

export const carrerasByUniversidadQuery = (idUniversidad: string) =>
  queryOptions({
    queryKey: ["catalogos", "universidades", idUniversidad, "carreras"],
    queryFn: () => listCarrerasByUniversidad(idUniversidad),
  });

export const teachersQuery = () =>
  queryOptions({ queryKey: queryKeys.teachers, queryFn: () => listTeachers(), meta: MEMORY_ONLY });

export const usuariosQuery = () =>
  queryOptions({ queryKey: queryKeys.usuarios, queryFn: () => listUsuarios(), meta: MEMORY_ONLY });

export const logsQuery = () => queryOptions({ queryKey: queryKeys.logs, queryFn: () => listLogs(), meta: MEMORY_ONLY });

/** Aplica `updater` sobre la lista cacheada de `queryKey` (igual que un setState funcional),
 *  para reflejar al instante lo que el servidor ya respondió tras crear/editar/borrar. Si esa
 *  lista todavía no está en caché no hace nada: se cargará completa la próxima vez. */
export function updateCachedList<T>(queryClient: QueryClient, queryKey: QueryKey, updater: (current: T[]) => T[]) {
  queryClient.setQueryData<T[]>(queryKey, (current) => (current === undefined ? current : updater(current)));
}

/** Marca como desactualizadas las consultas afectadas por una escritura: las que están en
 *  pantalla se vuelven a pedir en segundo plano y las demás al volver a abrirse. */
export function invalidateKeys(queryClient: QueryClient, ...keys: QueryKey[]) {
  for (const queryKey of keys) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

/** Lo que cambia al registrar un pago o un cargo (los saldos y estatus de cargos dependen de los
 *  pagos, y la alerta de color de cada alumno depende de sus cargos). */
export function invalidateAfterPaymentChange(queryClient: QueryClient) {
  invalidateKeys(queryClient, queryKeys.payments, queryKeys.cargos);
}
