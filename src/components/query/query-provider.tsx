"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";
import { QUERY_CACHE_STORAGE_KEY } from "@/lib/query/client-cache";
import { decryptFromCache, encryptForCache, loadCacheKey, unlockClientCache } from "@/lib/query/cache-crypto";

/** Cuánto tiempo puede vivir la copia local en el equipo: lo mismo que dura la cookie de sesión
 *  (ver SESSION_MAX_AGE_SECONDS en lib/auth/session.ts). */
const PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

/** Subirlo invalida las copias locales de todos los equipos (ej. si cambia la forma de algún dato). */
const CACHE_VERSION = "v2";

/** Si no se pudo obtener la llave (ej. mala conexión al iniciar sesión), cada cuánto reintentar. */
const KEY_RETRY_MS = 60 * 1000;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Durante este tiempo los datos se consideran frescos y cambiar de pantalla no vuelve a
        // pedirlos; pasado, se muestran igual y se refrescan en segundo plano.
        staleTime: 30 * 1000,
        // Tiene que ser al menos PERSIST_MAX_AGE_MS: lo que se saca de memoria tampoco se guarda.
        gcTime: PERSIST_MAX_AGE_MS,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        // Para que los cambios hechos desde otras computadoras aparezcan pronto. Sin conexión no
        // corre: TanStack pausa las consultas mientras navigator.onLine es false y las reanuda
        // al volver (refetchOnReconnect).
        refetchInterval: 60 * 1000,
      },
    },
  });
}

/** Copia local en IndexedDB vía idb-keyval (no localStorage: ~5 MB de límite y bloquea el hilo
 *  principal), cifrada con AES-GCM usando la llave del usuario (ver cache-crypto.ts). Solo se toca
 *  IndexedDB al restaurar/guardar, que PersistQueryClientProvider hace en efectos (nunca durante el
 *  render en el servidor). */
function createEncryptedPersister(userId: number) {
  unlockClientCache();

  let keyPromise: Promise<CryptoKey | null> | null = null;
  let failedAt = 0;
  function getKey(): Promise<CryptoKey | null> {
    if (!keyPromise || (failedAt > 0 && Date.now() - failedAt > KEY_RETRY_MS)) {
      failedAt = 0;
      keyPromise = loadCacheKey(userId).then((key) => {
        if (!key) failedAt = Date.now();
        return key;
      });
    }
    return keyPromise;
  }

  return createAsyncStoragePersister({
    storage: {
      getItem: async (storageKey) => {
        const key = await getKey();
        if (!key) return null;
        const stored = await get<unknown>(storageKey);
        if (stored === undefined) return null;
        const text = await decryptFromCache(key, stored);
        // Ilegible con esta llave (de otro usuario o del formato viejo sin cifrar): se descarta.
        if (text === null) await del(storageKey);
        return text;
      },
      setItem: async (storageKey, value) => {
        const key = await getKey();
        if (!key) return;
        const encrypted = await encryptForCache(key, value);
        if (encrypted) await set(storageKey, encrypted);
      },
      removeItem: (storageKey) => del(storageKey),
    },
    key: QUERY_CACHE_STORAGE_KEY,
    throttleTime: 2000,
  });
}

/** Caché compartido de datos del dashboard: cada pantalla muestra al instante la última copia
 *  guardada en el equipo y la actualiza contra el servidor en segundo plano. */
export function QueryProvider({ userId, children }: { userId: number; children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [persister] = useState(() => createEncryptedPersister(userId));

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE_MS,
        // La copia guardada se descarta si la dejó otro usuario (o una versión anterior del caché).
        buster: `${CACHE_VERSION}:${userId}`,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) && query.meta?.persist !== false,
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
