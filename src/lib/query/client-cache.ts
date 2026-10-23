import { del } from "idb-keyval";

/** Llave de IndexedDB donde se guarda la copia local de los datos (ver QueryProvider). */
export const QUERY_CACHE_STORAGE_KEY = "kyros:query-cache";

/** Nombre de los cachés del service worker (public/sw.js) que pueden contener páginas del
 *  dashboard ya renderizadas con datos del usuario. */
const SW_PAGE_CACHE_PREFIX = "kyros-pages-";

/** Borra todo lo que la app guardó en el equipo: la copia local de los datos (IndexedDB) y las
 *  páginas cacheadas por el service worker. Se llama al cerrar sesión y al entrar a /login, para
 *  que en una computadora compartida el siguiente usuario no vea información del anterior. */
export async function clearPersistedClientCache(): Promise<void> {
  const tasks: Promise<unknown>[] = [del(QUERY_CACHE_STORAGE_KEY).catch(() => undefined)];
  if (typeof caches !== "undefined") {
    tasks.push(
      caches
        .keys()
        .then((names) => Promise.all(names.filter((name) => name.startsWith(SW_PAGE_CACHE_PREFIX)).map((name) => caches.delete(name))))
        .catch(() => undefined)
    );
  }
  await Promise.all(tasks);
}
