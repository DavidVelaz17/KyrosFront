import { lockClientCache } from "@/lib/query/cache-crypto";

/** Llave de IndexedDB donde se guarda la copia local (cifrada) de los datos (ver QueryProvider). */
export const QUERY_CACHE_STORAGE_KEY = "kyros:query-cache";

/** Nombre de los cachés del service worker (public/sw.js) que pueden contener páginas del
 *  dashboard ya renderizadas con datos del usuario. */
const SW_PAGE_CACHE_PREFIX = "kyros-pages-";

/** Se llama al cerrar sesión y al entrar a /login. La copia de los datos se queda en el equipo,
 *  pero cifrada y sin llave (ver lockClientCache): ilegible hasta que ese mismo usuario vuelva a
 *  iniciar sesión, momento en que abre al instante. Las páginas del service worker sí se borran,
 *  porque esas no van cifradas. */
export async function lockPersistedClientCache(): Promise<void> {
  const tasks: Promise<unknown>[] = [lockClientCache()];
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
